import { describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './create-http-client';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import type { AuthSession } from '@/types';

describe('createHttpClient single-flight 401 refresh', () => {
  it('calls POST /auth/refresh exactly once for multiple concurrent 401 requests and replays both', async () => {
    let refreshCallCount = 0;
    let task1Attempts = 0;
    let task2Attempts = 0;

    const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const url = config.url ?? '';
      const auth = typeof config.headers.get === 'function'
        ? config.headers.get('Authorization')
        : (config.headers as Record<string, unknown>)['Authorization'];

      if (url.includes('/auth/refresh')) {
        refreshCallCount++;
        // Simulate small network delay for refresh
        await new Promise((resolve) => setTimeout(resolve, 30));
        const session: AuthSession = {
          user: {
            id: 'u1',
            email: 'test@example.com',
            emailVerified: true,
            loginProviders: ['password'],
            fullName: 'Teacher',
            displayName: 'Teacher',
            gender: 'female',
            onboardingCompletedAt: '2026-09-01T08:00:00.000Z',
          },
          accessToken: 'fresh-access-token',
          expiresAt: '2026-10-24T12:00:00.000Z',
          refreshToken: 'fresh-refresh-token',
          refreshExpiresAt: '2026-11-24T12:00:00.000Z',
        };
        return {
          data: session,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (url.includes('/tasks/1')) {
        task1Attempts++;
        if (auth !== 'Bearer fresh-access-token') {
          throw new AxiosError('Unauthorized', '401', config, {}, {
            data: { code: 'unauthorized', message: 'Token expired' },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
          });
        }
        return {
          data: { id: '1', title: 'Task 1' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (url.includes('/tasks/2')) {
        task2Attempts++;
        if (auth !== 'Bearer fresh-access-token') {
          throw new AxiosError('Unauthorized', '401', config, {}, {
            data: { code: 'unauthorized', message: 'Token expired' },
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
          });
        }
        return {
          data: { id: '2', title: 'Task 2' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      return {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    let currentToken: string | null = 'stale-access-token';
    const onTokenRefreshed = vi.fn((session: AuthSession) => {
      currentToken = session.accessToken;
    });
    const onUnauthorized = vi.fn();

    const client = createHttpClient({
      mode: 'http',
      getAccessToken: () => currentToken,
      getRefreshToken: () => 'valid-refresh-token',
      onTokenRefreshed,
      onUnauthorized,
    });
    client.defaults.adapter = customAdapter;

    // Fire two requests concurrently
    const [res1, res2] = await Promise.all([
      client.get('/tasks/1'),
      client.get('/tasks/2'),
    ]);

    expect(res1.data).toEqual({ id: '1', title: 'Task 1' });
    expect(res2.data).toEqual({ id: '2', title: 'Task 2' });

    // Verify single-flight refresh was executed EXACTLY ONCE
    expect(refreshCallCount).toBe(1);
    expect(task1Attempts).toBe(2);
    expect(task2Attempts).toBe(2);
    expect(onTokenRefreshed).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('clears session and rejects all pending requests if refresh fails', async () => {
    const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const url = config.url ?? '';
      if (url.includes('/auth/refresh')) {
        throw new AxiosError('Unauthorized', '401', config, {}, {
          data: { code: 'unauthorized', message: 'Refresh token revoked' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        });
      }
      throw new AxiosError('Unauthorized', '401', config, {}, {
        data: { code: 'unauthorized', message: 'Token expired' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      mode: 'http',
      getAccessToken: () => 'stale-token',
      getRefreshToken: () => 'revoked-refresh-token',
      onUnauthorized,
    });
    client.defaults.adapter = customAdapter;

    await expect(Promise.all([client.get('/tasks/1'), client.get('/tasks/2')])).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does not trigger refresh if request had no authorization token', async () => {
    let refreshCalled = false;
    const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const url = config.url ?? '';
      if (url.includes('/auth/refresh')) {
        refreshCalled = true;
      }
      throw new AxiosError('Unauthorized', '401', config, {}, {
        data: { code: 'invalid_credentials', message: 'Bad credentials' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      });
    };

    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      mode: 'http',
      getAccessToken: () => null,
      getRefreshToken: () => 'refresh-token',
      onUnauthorized,
    });
    client.defaults.adapter = customAdapter;

    await expect(client.post('/auth/login', { email: 'a@b.com', password: '123' })).rejects.toThrow();
    expect(refreshCalled).toBe(false);
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('calls onOnboardingRequired when response is 403 with code onboarding_required', async () => {
    const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      throw new AxiosError('Forbidden', '403', config, {}, {
        data: { code: 'onboarding_required', message: 'Onboarding required' },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    };

    const onOnboardingRequired = vi.fn();
    const client = createHttpClient({
      mode: 'http',
      onOnboardingRequired,
    });
    client.defaults.adapter = customAdapter;

    await expect(client.get('/tasks')).rejects.toThrow();
    expect(onOnboardingRequired).toHaveBeenCalledTimes(1);
  });

  it('does not call onOnboardingRequired for other 403 errors', async () => {
    const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      throw new AxiosError('Forbidden', '403', config, {}, {
        data: { code: 'forbidden', message: 'Forbidden access' },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    };

    const onOnboardingRequired = vi.fn();
    const client = createHttpClient({
      mode: 'http',
      onOnboardingRequired,
    });
    client.defaults.adapter = customAdapter;

    await expect(client.get('/admin')).rejects.toThrow();
    expect(onOnboardingRequired).not.toHaveBeenCalled();
  });
});
