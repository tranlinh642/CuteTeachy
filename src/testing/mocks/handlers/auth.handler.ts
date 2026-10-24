import { EMAIL_PATTERN, LIMITS, profileSchema } from '@/utils';
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { MOCK_DEMO_CREDENTIALS } from '../seed/user.seed';
import {
  badRequest,
  conflict,
  created,
  forbidden,
  noContent,
  ok,
  payloadTooLarge,
  route,
  tooManyRequests,
  unauthorized,
  unsupportedMediaType,
} from '../mock-router';

export const MOCK_VERIFY_CODE = '123456';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_SESSION_MS = 1 * 24 * 60 * 60 * 1000;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const authRoutes = [
  route(
    'POST',
    ENDPOINTS.auth.register,
    (request, db) => {
      const { email, password, remember } = (request.body ?? {}) as Partial<RegisterCredentials>;

      const trimmedEmail = email?.trim().toLowerCase();
      if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
        return badRequest('Invalid email address');
      }

      if (!password || password.length < LIMITS.passwordMin || password.length > LIMITS.passwordMax) {
        return badRequest('Password length must be between 8 and 72 characters');
      }

      if (db.user.email.trim().toLowerCase() === trimmedEmail) {
        return conflict('email_taken', 'Email already taken');
      }

      db.user = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        emailVerified: false,
        loginProviders: ['password'],
        fullName: '',
        displayName: trimmedEmail.split('@')[0] ?? '',
        gender: null,
        onboardingCompletedAt: null,
      };

      const rememberFlag = Boolean(remember);
      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-access-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
        refreshToken: `mock-refresh-token-${Date.now()}`,
        refreshExpiresAt: new Date(
          Date.now() + (rememberFlag ? REFRESH_TOKEN_TTL_REMEMBER_MS : REFRESH_TOKEN_TTL_SESSION_MS),
        ).toISOString(),
      };
      return created(session);
    },
    { isPublic: true },
  ),

  route(
    'POST',
    ENDPOINTS.auth.login,
    (request, db) => {
      const { email, password, remember } = (request.body ?? {}) as Partial<LoginCredentials>;
      const trimmedEmail = email?.trim().toLowerCase();

      const matchesDemo =
        trimmedEmail === MOCK_DEMO_CREDENTIALS.email &&
        (password === MOCK_DEMO_CREDENTIALS.password || password === '123456');
      const matchesDb = trimmedEmail === db.user.email.trim().toLowerCase();

      if (!matchesDemo && !matchesDb) {
        return unauthorized('invalid_credentials', 'Email hoặc mật khẩu không đúng');
      }

      // Check email verification for password users (FE-06 requirement)
      if (matchesDb && !db.user.emailVerified && db.user.loginProviders?.includes('password')) {
        return forbidden('email_not_verified', 'Email chưa được xác thực');
      }

      const rememberFlag = remember !== false;
      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-access-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
        refreshToken: `mock-refresh-token-${Date.now()}`,
        refreshExpiresAt: new Date(
          Date.now() + (rememberFlag ? REFRESH_TOKEN_TTL_REMEMBER_MS : REFRESH_TOKEN_TTL_SESSION_MS),
        ).toISOString(),
      };
      return ok(session);
    },
    { isPublic: true },
  ),

  route(
    'POST',
    ENDPOINTS.auth.refresh,
    (request, db) => {
      const { refreshToken } = (request.body ?? {}) as { refreshToken?: string };
      if (!refreshToken || refreshToken === 'invalid' || refreshToken === 'expired') {
        return unauthorized('unauthorized', 'Invalid or expired refresh token');
      }

      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-refreshed-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
        refreshToken: `mock-new-refresh-token-${Date.now()}`,
        refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_REMEMBER_MS).toISOString(),
      };
      return ok(session);
    },
    { isPublic: true },
  ),

  route('POST', ENDPOINTS.auth.logout, () => noContent()),

  route('GET', ENDPOINTS.auth.me, (_request, db) => ok(db.user)),

  route(
    'POST',
    ENDPOINTS.auth.googleExchange,
    (request, db) => {
      const { code } = (request.body ?? {}) as { code?: string };
      if (!code || code === 'invalid') {
        return unauthorized('invalid_code', 'Invalid or expired code');
      }

      db.user = {
        ...db.user,
        emailVerified: true,
        loginProviders: Array.from(new Set([...(db.user.loginProviders ?? []), 'google'])),
        fullName: db.user.fullName || 'Google Teacher',
        displayName: db.user.displayName || 'Teacher',
        avatarUrl: db.user.avatarUrl || 'https://lh3.googleusercontent.com/mock-avatar.png',
      };

      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-google-access-${Date.now()}`,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
        refreshToken: `mock-google-refresh-${Date.now()}`,
        refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_REMEMBER_MS).toISOString(),
      };
      return ok(session);
    },
    { isPublic: true },
  ),

  route('PATCH', ENDPOINTS.auth.profile, (request, db) => {
    const parseResult = profileSchema.safeParse(request.body);
    if (!parseResult.success) {
      return badRequest('Invalid profile payload');
    }
    const { fullName, displayName, title, gender } = parseResult.data;

    const nextFullName = fullName !== undefined ? fullName.trim() : db.user.fullName;
    const nextDisplayName = displayName !== undefined ? displayName.trim() : db.user.displayName;
    const nextGender = gender !== undefined ? gender : db.user.gender;
    const nextTitle = title !== undefined ? (title && title.trim() ? title.trim() : undefined) : db.user.title;

    let onboardingCompletedAt = db.user.onboardingCompletedAt;
    if (nextFullName && nextDisplayName && nextGender && !onboardingCompletedAt) {
      onboardingCompletedAt = new Date().toISOString();
    }

    db.user = {
      ...db.user,
      fullName: nextFullName,
      displayName: nextDisplayName,
      title: nextTitle,
      gender: nextGender,
      onboardingCompletedAt,
    };
    return ok(db.user);
  }),

  route('POST', ENDPOINTS.auth.avatar, (request, db) => {
    let file: { size?: number; type?: string } | null = null;
    if (typeof FormData !== 'undefined' && request.body instanceof FormData) {
      file = request.body.get('file') as unknown as { size?: number; type?: string };
    } else if (typeof request.body === 'object' && request.body !== null && 'file' in request.body) {
      file = (request.body as { file: { size?: number; type?: string } }).file;
    }

    if (file) {
      if (typeof file.size === 'number' && file.size > MAX_AVATAR_BYTES) {
        return payloadTooLarge('file_too_large', 'File too large');
      }
      if (file.type && !ALLOWED_AVATAR_TYPES.includes(file.type)) {
        return unsupportedMediaType('unsupported_file_type', 'Unsupported file type');
      }
    }

    db.user = {
      ...db.user,
      avatarUrl: `https://storage.cuteteachy.vn/avatars/mock-avatar-${Date.now()}.png`,
    };
    return ok(db.user);
  }),

  route('DELETE', ENDPOINTS.auth.avatar, (_request, db) => {
    db.user = {
      ...db.user,
      avatarUrl: undefined,
    };
    return ok(db.user);
  }),

  route(
    'POST',
    ENDPOINTS.auth.verifyEmail,
    (request, db) => {
      const { email, code } = (request.body ?? {}) as Partial<VerifyEmailInput>;
      const trimmedEmail = email?.trim().toLowerCase();
      const trimmedCode = code?.trim();

      if (trimmedEmail?.includes('rate-limited') || trimmedCode === 'rate-limited') {
        return tooManyRequests();
      }

      if (!trimmedCode || trimmedCode !== MOCK_VERIFY_CODE) {
        return badRequest('Mã xác thực không hợp lệ hoặc đã hết hạn', 'invalid_code');
      }

      db.user = {
        ...db.user,
        email: trimmedEmail || db.user.email,
        emailVerified: true,
      };

      const session: AuthSession = {
        user: db.user,
        accessToken: `mock-access-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString(),
        refreshToken: `mock-refresh-token-${Date.now()}`,
        refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_REMEMBER_MS).toISOString(),
      };
      return ok(session);
    },
    { isPublic: true },
  ),

  route(
    'POST',
    ENDPOINTS.auth.resendEmailCode,
    (request) => {
      const { email } = (request.body ?? {}) as { email?: string };
      const trimmedEmail = email?.trim().toLowerCase();

      if (trimmedEmail?.includes('rate-limited')) {
        return tooManyRequests();
      }

      return noContent();
    },
    { isPublic: true },
  ),

  route(
    'POST',
    ENDPOINTS.auth.forgotPassword,
    (request) => {
      const { email } = (request.body ?? {}) as { email?: string };
      const trimmedEmail = email?.trim().toLowerCase();

      if (trimmedEmail?.includes('rate-limited')) {
        return tooManyRequests();
      }

      // Per SPEC-002: always returns 204
      return noContent();
    },
    { isPublic: true },
  ),

  route(
    'POST',
    ENDPOINTS.auth.resetPassword,
    (request) => {
      const { email, code, newPassword } = (request.body ?? {}) as Partial<ResetPasswordInput>;
      const trimmedEmail = email?.trim().toLowerCase();
      const trimmedCode = code?.trim();

      if (trimmedEmail?.includes('rate-limited') || trimmedCode === 'rate-limited') {
        return tooManyRequests();
      }

      if (!trimmedCode || trimmedCode !== MOCK_VERIFY_CODE) {
        return badRequest('Mã xác thực không hợp lệ hoặc đã hết hạn', 'invalid_code');
      }

      if (
        !newPassword ||
        newPassword.length < LIMITS.passwordMin ||
        newPassword.length > LIMITS.passwordMax
      ) {
        return badRequest('Password length must be between 8 and 72 characters');
      }

      return noContent();
    },
    { isPublic: true },
  ),
];
