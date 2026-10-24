import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, toApiError } from '@/lib/api';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { useSessionStore } from '@/stores';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { createMockDb } from '@/testing/mocks/mock-db';
import { MOCK_DEMO_CREDENTIALS } from '@/testing/mocks/seed/user.seed';
import { registerSchema, validate } from '@/utils';
import { vi as viLocale } from '@/lib/i18n/locales/vi';
import { en as enLocale } from '@/lib/i18n/locales/en';
import { AxiosError, AxiosHeaders } from 'axios';

const setupServices = () => {
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

describe('Register flow and contract verification', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  describe('Client validation and FieldError', () => {
    it('catches invalid email, short password, and mismatched password', () => {
      const result = validate(registerSchema, {
        email: 'invalid-email',
        password: 'pass',
        confirmPassword: 'other',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.email?.key).toBe('validation.email');
        expect(result.errors.password?.key).toBe('validation.minLength');
        expect(result.errors.password?.params?.count).toBe(8);
        expect(result.errors.confirmPassword?.key).toBe('auth.register.passwordMismatch');
      }
    });

    it('validates matching valid passwords and trims email', () => {
      const result = validate(registerSchema, {
        email: '  teacher@school.edu.vn  ',
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123',
        remember: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('teacher@school.edu.vn');
        expect(result.data.password).toBe('ValidPassword123');
        expect(result.data.remember).toBe(true);
      }
    });
  });

  describe('End-to-end registration on mock backend', () => {
    it('registers successfully, returns 201 AuthSession with uncompleted onboarding, and sets session store', async () => {
      const { services } = setupServices();

      const newEmail = 'newteacher@school.edu.vn';
      const session = await services.auth.register({
        email: newEmail,
        password: 'SecretPassword88',
        remember: true,
      });

      expect(session).toBeDefined();
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
      expect(session.user.email).toBe(newEmail);
      expect(session.user.gender).toBeNull();
      expect(session.user.onboardingCompletedAt).toBeNull();

      // Store in session
      useSessionStore.getState().setSession(session);
      const state = useSessionStore.getState();
      expect(state.session?.user.email).toBe(newEmail);
      expect(state.session?.user.onboardingCompletedAt).toBeNull();
    });

    it('handles 409 email_taken with message suggesting login', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .register({
          email: MOCK_DEMO_CREDENTIALS.email,
          password: 'Password123',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('email_taken');
      expect(apiErr.status).toBe(409);
      expect(apiErr.messageKey).toBe('auth.errors.emailTaken');

      // Check i18n messages suggest login
      expect(viLocale.auth.errors.emailTaken.toLowerCase()).toContain('đăng nhập');
      expect(enLocale.auth.errors.emailTaken.toLowerCase()).toContain('sign in');
    });

    it('handles 429 rate_limited with its own distinct message', () => {
      const rateLimitAxiosError = new AxiosError(
        'Too many requests',
        'ERR_BAD_REQUEST',
        undefined,
        {},
        {
          data: { code: 'rate_limited', message: 'Rate limited' },
          status: 429,
          statusText: 'Too Many Requests',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
      const apiErr = toApiError(rateLimitAxiosError);
      expect(apiErr.code).toBe('rate_limited');
      expect(apiErr.status).toBe(429);
      expect(apiErr.messageKey).toBe('errors.rateLimited');

      // Ensure rate_limited message is distinct from email_taken
      expect(viLocale.errors.rateLimited).not.toBe(viLocale.auth.errors.emailTaken);
      expect(enLocale.errors.rateLimited).not.toBe(enLocale.auth.errors.emailTaken);
    });
  });

  describe('i18n navigation and register keys', () => {
    it('has login screen link keys for registration', () => {
      expect(viLocale.auth.login.noAccount).toBeTruthy();
      expect(viLocale.auth.login.signUp).toBeTruthy();
      expect(enLocale.auth.login.noAccount).toBeTruthy();
      expect(enLocale.auth.login.signUp).toBeTruthy();
    });

    it('has complete register translation keys in vi and en', () => {
      const requiredKeys: Array<keyof typeof viLocale.auth.register> = [
        'title',
        'subtitle',
        'emailLabel',
        'emailPlaceholder',
        'passwordLabel',
        'passwordPlaceholder',
        'confirmPasswordLabel',
        'confirmPasswordPlaceholder',
        'showPassword',
        'hidePassword',
        'showConfirmPassword',
        'hideConfirmPassword',
        'remember',
        'submit',
        'hasAccount',
        'signIn',
        'signInNow',
        'passwordMismatch',
      ];

      for (const key of requiredKeys) {
        expect(viLocale.auth.register[key]).toBeDefined();
        expect(enLocale.auth.register[key]).toBeDefined();
      }
    });
  });
});
