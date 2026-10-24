import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApiError } from '@/lib/api';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { useSessionStore } from '@/stores';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { createMockDb } from '@/testing/mocks/mock-db';
import { MOCK_DEMO_CREDENTIALS } from '@/testing/mocks/seed/user.seed';
import { CodeInput } from './components/CodeInput';
import { vi as viLocale } from '@/lib/i18n/locales/vi';
import { en as enLocale } from '@/lib/i18n/locales/en';

export const MOCK_VERIFY_CODE = '123456';

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

describe('Email verification and Forgot password contracts (FE-06)', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  describe('Login returning 403 email_not_verified', () => {
    it('returns 403 email_not_verified when user email is not verified', async () => {
      const { services, db } = setupServices();
      // Set user as unverified with password provider
      db.user = {
        ...db.user,
        email: 'unverified@cuteteachy.vn',
        emailVerified: false,
        loginProviders: ['password'],
      };

      const error = await services.auth
        .login({
          email: 'unverified@cuteteachy.vn',
          password: 'password123',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('email_not_verified');
      expect(apiErr.status).toBe(403);
      expect(apiErr.messageKey).toBe('auth.errors.emailNotVerified');
    });

    it('allows login when email is verified', async () => {
      const { services } = setupServices();
      const session = await services.auth.login({
        email: MOCK_DEMO_CREDENTIALS.email,
        password: MOCK_DEMO_CREDENTIALS.password,
      });

      expect(session).toBeDefined();
      expect(session.user.emailVerified).toBe(true);
      expect(session.accessToken).toBeTruthy();
    });
  });

  describe('POST /auth/email/verify', () => {
    it('verifies email with correct code, returns 200 AuthSession, and updates session store', async () => {
      const { services, db } = setupServices();
      db.user = {
        ...db.user,
        email: 'unverified@cuteteachy.vn',
        emailVerified: false,
      };

      const session = await services.auth.verifyEmail({
        email: 'unverified@cuteteachy.vn',
        code: MOCK_VERIFY_CODE,
      });

      expect(session).toBeDefined();
      expect(session.user.emailVerified).toBe(true);
      expect(session.accessToken).toBeTruthy();
      expect(db.user.emailVerified).toBe(true);

      // Verify that storing session in session store authenticates the user
      useSessionStore.getState().setSession(session);
      const state = useSessionStore.getState();
      expect(state.session?.user.emailVerified).toBe(true);
      expect(state.session?.accessToken).toBe(session.accessToken);
    });

    it('rejects invalid code with 400 invalid_code', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .verifyEmail({
          email: 'teacher@cuteteachy.vn',
          code: '000000',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('invalid_code');
      expect(apiErr.status).toBe(400);
      expect(apiErr.messageKey).toBe('auth.errors.invalidCode');
    });

    it('handles 429 rate_limited when rate limit triggered', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .verifyEmail({
          email: 'rate-limited@cuteteachy.vn',
          code: MOCK_VERIFY_CODE,
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('rate_limited');
      expect(apiErr.status).toBe(429);
      expect(apiErr.messageKey).toBe('errors.rateLimited');
    });
  });

  describe('POST /auth/email/resend', () => {
    it('returns 204 when resending code', async () => {
      const { services } = setupServices();

      const result = await services.auth.resendEmailCode('teacher@cuteteachy.vn');
      expect(result).toBeUndefined();
    });

    it('returns 429 when rate limited', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .resendEmailCode('rate-limited@cuteteachy.vn')
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('rate_limited');
      expect(apiErr.status).toBe(429);
      expect(apiErr.messageKey).toBe('errors.rateLimited');
    });
  });

  describe('POST /auth/password/forgot', () => {
    it('always returns 204 even for unknown email', async () => {
      const { services } = setupServices();

      const result = await services.auth.forgotPassword('nonexistent@cuteteachy.vn');
      expect(result).toBeUndefined();
    });

    it('returns 429 when rate limited', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .forgotPassword('rate-limited@cuteteachy.vn')
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('rate_limited');
      expect(apiErr.status).toBe(429);
      expect(apiErr.messageKey).toBe('errors.rateLimited');
    });
  });

  describe('POST /auth/password/reset', () => {
    it('resets password successfully with valid code and 8-72 char password', async () => {
      const { services } = setupServices();

      const result = await services.auth.resetPassword({
        email: 'teacher@cuteteachy.vn',
        code: MOCK_VERIFY_CODE,
        newPassword: 'BrandNewPassword88',
      });
      expect(result).toBeUndefined();
    });

    it('returns 400 invalid_code when code does not match', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .resetPassword({
          email: 'teacher@cuteteachy.vn',
          code: 'wrong9',
          newPassword: 'BrandNewPassword88',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('invalid_code');
      expect(apiErr.status).toBe(400);
      expect(apiErr.messageKey).toBe('auth.errors.invalidCode');
    });

    it('returns 400 validation when password is too short', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .resetPassword({
          email: 'teacher@cuteteachy.vn',
          code: MOCK_VERIFY_CODE,
          newPassword: 'short',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('validation');
      expect(apiErr.status).toBe(400);
    });

    it('returns 429 when rate limited', async () => {
      const { services } = setupServices();

      const error = await services.auth
        .resetPassword({
          email: 'rate-limited@cuteteachy.vn',
          code: MOCK_VERIFY_CODE,
          newPassword: 'BrandNewPassword88',
        })
        .catch((err: unknown) => err);

      expect(error).toBeInstanceOf(ApiError);
      const apiErr = error as ApiError;
      expect(apiErr.code).toBe('rate_limited');
      expect(apiErr.status).toBe(429);
      expect(apiErr.messageKey).toBe('errors.rateLimited');
    });
  });

  describe('CodeInput mobile & accessibility attributes', () => {
    it('renders input with numeric keypad and one-time-code autocomplete for mobile', () => {
      const html = renderToStaticMarkup(
        <CodeInput value="123" onChange={() => undefined} label="Mã xác thực" />,
      );

      expect(html).toContain('inputMode="numeric"');
      expect(html).toContain('pattern="[0-9]*"');
      expect(html).toContain('autoComplete="one-time-code"');
      expect(html).toContain('maxLength="6"');
      // 6 boxes rendered
      expect(html).toContain('>1<');
      expect(html).toContain('>2<');
      expect(html).toContain('>3<');
    });
  });

  describe('i18n verify and reset keys completeness', () => {
    it('has complete verify and reset keys in vi and en', () => {
      expect(viLocale.auth.verify.title).toBeTruthy();
      expect(viLocale.auth.verify.codeLabel).toBeTruthy();
      expect(viLocale.auth.verify.submit).toBeTruthy();
      expect(viLocale.auth.verify.resendButton).toBeTruthy();
      expect(viLocale.auth.verify.resendCountdown).toBeTruthy();

      expect(enLocale.auth.verify.title).toBeTruthy();
      expect(enLocale.auth.verify.codeLabel).toBeTruthy();
      expect(enLocale.auth.verify.submit).toBeTruthy();
      expect(enLocale.auth.verify.resendButton).toBeTruthy();
      expect(enLocale.auth.verify.resendCountdown).toBeTruthy();

      expect(viLocale.auth.reset.forgotTitle).toBeTruthy();
      expect(viLocale.auth.reset.forgotEmailLabel).toBeTruthy();
      expect(viLocale.auth.reset.forgotSubmit).toBeTruthy();
      expect(viLocale.auth.reset.forgotSuccessNote).toBeTruthy();
      expect(viLocale.auth.reset.resetTitle).toBeTruthy();
      expect(viLocale.auth.reset.newPasswordLabel).toBeTruthy();
      expect(viLocale.auth.reset.confirmPasswordLabel).toBeTruthy();
      expect(viLocale.auth.reset.submit).toBeTruthy();

      expect(enLocale.auth.reset.forgotTitle).toBeTruthy();
      expect(enLocale.auth.reset.forgotEmailLabel).toBeTruthy();
      expect(enLocale.auth.reset.forgotSubmit).toBeTruthy();
      expect(enLocale.auth.reset.forgotSuccessNote).toBeTruthy();
      expect(enLocale.auth.reset.resetTitle).toBeTruthy();
      expect(enLocale.auth.reset.newPasswordLabel).toBeTruthy();
      expect(enLocale.auth.reset.confirmPasswordLabel).toBeTruthy();
      expect(enLocale.auth.reset.submit).toBeTruthy();
    });
  });
});
