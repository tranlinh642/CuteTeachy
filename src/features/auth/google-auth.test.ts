import { describe, expect, it } from 'vitest';
import { vi as viLocale } from '@/lib/i18n/locales/vi';
import { en as enLocale } from '@/lib/i18n/locales/en';
import {
  clearOAuthRemember,
  readOAuthRemember,
  saveOAuthRemember,
} from './utils/oauth-storage';
import {
  MOCK_GOOGLE_CODE,
  buildGoogleAuthUrl,
} from './components/GoogleLoginButton';
import {
  processAuthCallback,
  resolveOAuthErrorMessage,
} from './hooks/use-auth-callback';
import { ApiError } from '@/lib/api';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { createMockDb } from '@/testing/mocks/mock-db';
import type { AuthSession } from '@/types';

describe('Google OAuth i18n keys', () => {
  it('has matching google translations for vi and en', () => {
    expect(viLocale.auth.google).toBeDefined();
    expect(enLocale.auth.google).toBeDefined();

    expect(viLocale.auth.google.button).toBe('Tiếp tục với Google');
    expect(enLocale.auth.google.button).toBe('Continue with Google');

    expect(viLocale.auth.google.or).toBeTruthy();
    expect(enLocale.auth.google.or).toBeTruthy();

    expect(viLocale.auth.google.callbackLoading).toBeTruthy();
    expect(enLocale.auth.google.callbackLoading).toBeTruthy();

    expect(viLocale.auth.google.errors.googleFailed).toBeTruthy();
    expect(enLocale.auth.google.errors.googleFailed).toBeTruthy();

    expect(viLocale.auth.google.errors.invalidCode).toBeTruthy();
    expect(enLocale.auth.google.errors.invalidCode).toBeTruthy();

    expect(viLocale.auth.google.errors.network).toBeTruthy();
    expect(enLocale.auth.google.errors.network).toBeTruthy();

    expect(viLocale.auth.google.errors.missingCode).toBeTruthy();
    expect(enLocale.auth.google.errors.missingCode).toBeTruthy();
  });
});

describe('OAuth remember storage', () => {
  it('saves, reads, and clears remember choice across the OAuth flow', () => {
    clearOAuthRemember();
    // Default is true when nothing is stored
    expect(readOAuthRemember()).toBe(true);

    saveOAuthRemember(false);
    expect(readOAuthRemember()).toBe(false);

    saveOAuthRemember(true);
    expect(readOAuthRemember()).toBe(true);

    clearOAuthRemember();
    expect(readOAuthRemember()).toBe(true);
  });
});

describe('buildGoogleAuthUrl', () => {
  it('directs directly to /auth/callback with mock code when mock mode is enabled', () => {
    const url = buildGoogleAuthUrl({ isMock: true, remember: true });
    expect(url).toBe(`/auth/callback?code=${MOCK_GOOGLE_CODE}`);
  });

  it('builds API Google redirect url preserving remember=true', () => {
    const url = buildGoogleAuthUrl({
      apiUrl: 'http://localhost:4000',
      remember: true,
      isMock: false,
    });
    expect(url).toBe('http://localhost:4000/auth/google?remember=true');
  });

  it('builds API Google redirect url preserving remember=false', () => {
    const url = buildGoogleAuthUrl({
      apiUrl: 'https://api.cuteteachy.vn',
      remember: false,
      isMock: false,
    });
    expect(url).toBe('https://api.cuteteachy.vn/auth/google?remember=false');
  });
});

describe('processAuthCallback', () => {
  const createMockSession = (onboardingCompletedAt: string | null = '2026-10-24T10:00:00Z'): AuthSession => ({
    user: {
      id: 'user-google-1',
      email: 'teacher@google.com',
      emailVerified: true,
      loginProviders: ['google'],
      fullName: 'Google Teacher',
      displayName: 'Teacher',
      gender: null,
      onboardingCompletedAt,
    },
    accessToken: 'access-token-123',
    expiresAt: '2026-10-24T10:15:00Z',
    refreshToken: 'refresh-token-123',
    refreshExpiresAt: '2026-11-24T10:00:00Z',
  });

  it('exchanges code, sets session with remember preference, and replaces route to /', async () => {
    let storedSession: AuthSession | null = null;
    let storedRemember: boolean | null = null;
    let clearedRemember = false;
    let navigatedTo: string | null = null;
    let exchangeCallCount = 0;

    const mockSession = createMockSession();

    await processAuthCallback({
      code: 'valid-google-code',
      error: null,
      exchange: async (code) => {
        expect(code).toBe('valid-google-code');
        exchangeCallCount++;
        return mockSession;
      },
      setSession: (s, r) => {
        storedSession = s;
        storedRemember = r;
      },
      readRemember: () => false,
      clearRemember: () => {
        clearedRemember = true;
      },
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(exchangeCallCount).toBe(1);
    expect(storedSession).toEqual(mockSession);
    expect(storedRemember).toBe(false);
    expect(clearedRemember).toBe(true);
    expect(navigatedTo).toBe('/');
  });

  it('redirects to /onboarding if teacher has not completed onboarding', async () => {
    let navigatedTo: string | null = null;
    const mockSession = createMockSession(null);

    await processAuthCallback({
      code: 'valid-google-code',
      error: null,
      exchange: async () => mockSession,
      setSession: () => {},
      readRemember: () => true,
      clearRemember: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(navigatedTo).toBe('/onboarding');
  });

  it('redirects to /login?error=google_failed when error param is present without calling exchange', async () => {
    let navigatedTo: string | null = null;
    let exchangeCalled = false;

    await processAuthCallback({
      code: 'some-code',
      error: 'google_failed',
      exchange: async () => {
        exchangeCalled = true;
        return createMockSession();
      },
      setSession: () => {},
      readRemember: () => true,
      clearRemember: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(exchangeCalled).toBe(false);
    expect(navigatedTo).toBe('/login?error=google_failed');
  });

  it('redirects to /login?error=missing_code when code is missing without calling exchange', async () => {
    let navigatedTo: string | null = null;
    let exchangeCalled = false;

    await processAuthCallback({
      code: null,
      error: null,
      exchange: async () => {
        exchangeCalled = true;
        return createMockSession();
      },
      setSession: () => {},
      readRemember: () => true,
      clearRemember: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(exchangeCalled).toBe(false);
    expect(navigatedTo).toBe('/login?error=missing_code');
  });

  it('handles exchange error invalid_code and navigates to /login?error=invalid_code', async () => {
    let navigatedTo: string | null = null;

    await processAuthCallback({
      code: 'invalid-code',
      error: null,
      exchange: async () => {
        throw new ApiError('invalid_code', 'Invalid code', 401);
      },
      setSession: () => {},
      readRemember: () => true,
      clearRemember: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(navigatedTo).toBe('/login?error=invalid_code');
  });

  it('handles network error during exchange and navigates to /login?error=network', async () => {
    let navigatedTo: string | null = null;

    await processAuthCallback({
      code: 'code-123',
      error: null,
      exchange: async () => {
        throw new ApiError('network', 'Network error');
      },
      setSession: () => {},
      readRemember: () => true,
      clearRemember: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    expect(navigatedTo).toBe('/login?error=network');
  });
});

describe('resolveOAuthErrorMessage', () => {
  it('maps various error codes to appropriate i18n messages', () => {
    const mockT = (key: string) => `[${key}]`;

    expect(resolveOAuthErrorMessage(null, mockT as never)).toBeNull();
    expect(resolveOAuthErrorMessage('google_failed', mockT as never)).toBe(
      '[auth.google.errors.googleFailed]',
    );
    expect(resolveOAuthErrorMessage('invalid_code', mockT as never)).toBe(
      '[auth.google.errors.invalidCode]',
    );
    expect(resolveOAuthErrorMessage('network', mockT as never)).toBe(
      '[auth.google.errors.network]',
    );
    expect(resolveOAuthErrorMessage('missing_code', mockT as never)).toBe(
      '[auth.google.errors.missingCode]',
    );
    // Fallback on unexpected error string
    expect(resolveOAuthErrorMessage('something_else', mockT as never)).toBe(
      '[auth.google.errors.googleFailed]',
    );
  });
});

describe('Google OAuth flow with Mock Backend', () => {
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
    return { services, db, setToken: (val: string | null) => (token = val) };
  };

  it('exchanges mock code successfully and links google login provider', async () => {
    const { services } = setupServices();
    const session = await services.auth.googleExchange(MOCK_GOOGLE_CODE);

    expect(session).toBeDefined();
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(session.user.loginProviders).toContain('google');
    expect(session.user.emailVerified).toBe(true);
    expect(session.user.avatarUrl).toBeTruthy();
  });

  it('handles invalid code and returns ApiError invalid_code (401)', async () => {
    const { services } = setupServices();

    const err = await services.auth.googleExchange('invalid').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const apiError = err as ApiError;
    expect(apiError.code).toBe('invalid_code');
    expect(apiError.status).toBe(401);
    expect(apiError.messageKey).toBe('auth.errors.invalidCode');
  });
});





