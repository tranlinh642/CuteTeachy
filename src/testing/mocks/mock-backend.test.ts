import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockDb } from './mock-db';
import { createMockAdapter } from './mock-adapter';
import { MOCK_DEMO_CREDENTIALS } from './seed/user.seed';

const setup = () => {
  let token: string | null = null;
  const db = createMockDb();
  const httpClient = createHttpClient({
    mode: 'mock',
    mockLatencyMs: 0,
    getAccessToken: () => token,
    getLocale: () => 'vi',
    onUnauthorized: () => undefined,
  });
  httpClient.defaults.adapter = createMockAdapter({ latencyMs: 0, db });
  const services = createServices(httpClient);
  return { services, db, setToken: (value: string | null) => (token = value) };
};

describe('mock backend', () => {
  it('rejects protected routes without a token', async () => {
    const { services } = setup();
    await expect(services.tasks.list()).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('rejects wrong credentials with a translated error key', async () => {
    const { services } = setup();
    const error = await services.auth.login({ email: 'x@y.z', password: 'wrongpassword' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).messageKey).toBe('auth.errors.invalidCredentials');
  });

  it('logs in and returns AuthSession with refreshToken and demo user with onboarding completed', async () => {
    const { services } = setup();
    const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.refreshExpiresAt).toBeDefined();
    expect(session.user.email).toBe(MOCK_DEMO_CREDENTIALS.email);
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.loginProviders).toContain('password');
    expect(session.user.onboardingCompletedAt).not.toBeNull();
  });

  it('registers a new user, returning 201 session with onboardingCompletedAt null', async () => {
    const { services } = setup();
    const session = await services.auth.register({
      email: 'newbie@school.edu.vn',
      password: 'mypassword123',
    });

    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.user.email).toBe('newbie@school.edu.vn');
    expect(session.user.emailVerified).toBe(false);
    expect(session.user.gender).toBeNull();
    expect(session.user.onboardingCompletedAt).toBeNull();
  });

  it('rejects registration with existing email with 409 email_taken', async () => {
    const { services } = setup();
    const err = await services.auth
      .register({
        email: MOCK_DEMO_CREDENTIALS.email,
        password: 'password123',
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('email_taken');
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).messageKey).toBe('auth.errors.emailTaken');
  });

  it('rejects registration with short password with 400 validation', async () => {
    const { services } = setup();
    const err = await services.auth
      .register({
        email: 'valid@cuteteachy.vn',
        password: 'short',
      })
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('validation');
    expect((err as ApiError).status).toBe(400);
  });

  it('handles token refresh with valid and invalid tokens', async () => {
    const { services } = setup();
    const refreshed = await services.auth.refresh('valid-mock-token');
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();

    const err = await services.auth.refresh('invalid').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('unauthorized');
  });

  it('handles google exchange for OAuth flow', async () => {
    const { services } = setup();
    const session = await services.auth.googleExchange('valid-code');
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.loginProviders).toContain('google');

    const err = await services.auth.googleExchange('invalid').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('invalid_code');
  });

  it('blocks business routes with 403 onboarding_required when onboardingCompletedAt is null, but permits auth routes', async () => {
    const { services, setToken } = setup();
    // Register a user who has onboardingCompletedAt = null
    const session = await services.auth.register({
      email: 'fresh@school.edu.vn',
      password: 'password123',
    });
    setToken(session.accessToken);

    // Business route should be blocked
    const businessErr = await services.tasks.list().catch((e: unknown) => e);
    expect(businessErr).toBeInstanceOf(ApiError);
    expect((businessErr as ApiError).code).toBe('onboarding_required');
    expect((businessErr as ApiError).status).toBe(403);
    expect((businessErr as ApiError).messageKey).toBe('auth.errors.onboardingRequired');

    // /auth/me should succeed even without onboarding
    const me = await services.auth.me();
    expect(me.email).toBe('fresh@school.edu.vn');
    expect(me.onboardingCompletedAt).toBeNull();

    // Completing onboarding via updateProfile
    const updated = await services.auth.updateProfile({
      fullName: 'Cô Mai',
      displayName: 'Mai',
      gender: 'female',
    });
    expect(updated.onboardingCompletedAt).not.toBeNull();

    // Now business routes are unlocked!
    const tasks = await services.tasks.list();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('handles avatar upload and deletion with size and type constraints', async () => {
    const { services, setToken } = setup();
    const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
    setToken(session.accessToken);

    // Upload oversized file (> 2MB)
    const bigFile = new File(['a'.repeat(2 * 1024 * 1024 + 10)], 'huge.png', { type: 'image/png' });
    const sizeErr = await services.auth.uploadAvatar(bigFile).catch((e: unknown) => e);
    expect(sizeErr).toBeInstanceOf(ApiError);
    expect((sizeErr as ApiError).code).toBe('file_too_large');
    expect((sizeErr as ApiError).status).toBe(413);

    // Upload unsupported type
    const pdfFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const typeErr = await services.auth.uploadAvatar(pdfFile).catch((e: unknown) => e);
    expect(typeErr).toBeInstanceOf(ApiError);
    expect((typeErr as ApiError).code).toBe('unsupported_file_type');
    expect((typeErr as ApiError).status).toBe(415);

    // Upload valid image
    const validFile = new File(['fake-png-content'], 'avatar.png', { type: 'image/png' });
    const uploadedUser = await services.auth.uploadAvatar(validFile);
    expect(uploadedUser.avatarUrl).toContain('storage.cuteteachy.vn');

    // Delete avatar
    const deletedUser = await services.auth.deleteAvatar();
    expect(deletedUser.avatarUrl).toBeUndefined();
  });

  it('logs in and performs task CRUD', async () => {
    const { services, setToken } = setup();
    const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
    setToken(session.accessToken);

    const created = await services.tasks.create({ title: 'Viết giáo án', date: '2026-10-09', category: 'school' });
    expect(created).toMatchObject({ title: 'Viết giáo án', completed: false, priority: 'normal' });

    const updated = await services.tasks.update(created.id, { completed: true });
    expect(updated.completed).toBe(true);

    const range = await services.tasks.list({ from: '2026-10-09', to: '2026-10-09' });
    expect(range.some((task) => task.id === created.id)).toBe(true);

    await services.tasks.remove(created.id);
    await expect(services.tasks.update(created.id, { completed: false })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('updates user profile and switches gender', async () => {
    const { services, setToken } = setup();
    const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
    setToken(session.accessToken);

    const updated = await services.auth.updateProfile({
      fullName: 'Thầy Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'Thầy giáo Hóa học',
      gender: 'male',
    });

    expect(updated).toMatchObject({
      fullName: 'Thầy Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'Thầy giáo Hóa học',
      gender: 'male',
    });

    const me = await services.auth.me();
    expect(me.gender).toBe('male');
    expect(me.displayName).toBe('Nam');

    // Test clearing title and ensuring protected fields (like email/id) are never overwritten
    const originalEmail = me.email;
    const originalId = me.id;

    const cleared = await services.auth.updateProfile({
      fullName: 'Thầy Nguyễn Văn Nam',
      displayName: 'Nam',
      title: '',
      gender: 'male',
      // @ts-expect-error verifying protected field
      email: 'hacked@domain.com',
    });

    expect(cleared.title).toBeUndefined();
    expect(cleared.email).toBe(originalEmail);
    expect(cleared.id).toBe(originalId);
  });
});
