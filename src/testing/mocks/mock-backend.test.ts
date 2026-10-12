import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { MOCK_DEMO_CREDENTIALS } from './seed/user.seed';

const setup = () => {
  let token: string | null = null;
  const services = createServices(
    createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => token,
      getLocale: () => 'vi',
      onUnauthorized: () => undefined,
    }),
  );
  return { services, setToken: (value: string) => (token = value) };
};

describe('mock backend', () => {
  it('rejects protected routes without a token', async () => {
    const { services } = setup();
    await expect(services.tasks.list()).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('rejects wrong credentials with a translated error key', async () => {
    const { services } = setup();
    const error = await services.auth.login({ email: 'x@y.z', password: 'nope' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).messageKey).toBe('auth.errors.invalidCredentials');
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

