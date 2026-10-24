import { getAccessToken, getRefreshToken, usePreferencesStore, useSessionStore } from '@/stores';
import axios, { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_API_URL, type ApiConfig } from '@/config';
import type { AuthSession } from '@/types';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { toApiError } from './api-error';
import { ENDPOINTS } from './endpoints';

/**
 * Shared Axios instance for web & mobile.
 *  - request:  attaches `Authorization: Bearer <token>` and `Accept-Language`
 *  - response: normalises errors to `ApiError`, triggers single-flight token refresh on 401
 *  - mode "mock": swaps the transport for the in-memory mock adapter
 */
export const createHttpClient = (config: ApiConfig = {}): AxiosInstance => {
  const {
    baseURL = DEFAULT_API_URL,
    mode = 'mock',
    mockLatencyMs = 350,
    timeoutMs = 15_000,
    getAccessToken: readToken = getAccessToken,
    getRefreshToken: readRefreshToken = getRefreshToken,
    onTokenRefreshed = (session: AuthSession) => {
      const remember = useSessionStore.getState().remember;
      useSessionStore.getState().setSession(session, remember);
    },
    getLocale = () => usePreferencesStore.getState().locale,
    onUnauthorized = () => useSessionStore.getState().clearSession(),
  } = config;

  const http = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
    adapter: mode === 'mock' ? createMockAdapter({ latencyMs: mockLatencyMs }) : undefined,
  });

  http.interceptors.request.use((request) => {
    // If request already has Authorization header explicitly set (or explicitly cleared), respect it
    if (!request.headers.has('Authorization')) {
      const token = readToken();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
    }
    if (!request.headers.has('Accept-Language')) {
      request.headers.set('Accept-Language', getLocale());
    }
    return request;
  });

  let refreshPromise: Promise<string> | null = null;

  http.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const authHeader = originalRequest?.headers
          ? typeof originalRequest.headers.get === 'function'
            ? originalRequest.headers.get('Authorization')
            : (originalRequest.headers as Record<string, unknown>)['Authorization']
          : undefined;

        const isRefreshRequest = originalRequest?.url?.endsWith(ENDPOINTS.auth.refresh);

        // Only retry if request had an authorization token, was not already retried, and is not /auth/refresh
        if (originalRequest && !originalRequest._retry && authHeader && !isRefreshRequest) {
          originalRequest._retry = true;

          const refreshToken = readRefreshToken();
          if (!refreshToken) {
            onUnauthorized();
            return Promise.reject(toApiError(error));
          }

          if (!refreshPromise) {
            refreshPromise = http
              .post<AuthSession>(
                ENDPOINTS.auth.refresh,
                { refreshToken },
                {
                  headers: { Authorization: '' },
                },
              )
              .then((res) => {
                const newSession = res.data;
                onTokenRefreshed(newSession);
                return newSession.accessToken;
              })
              .catch((refreshErr: unknown) => {
                onUnauthorized();
                throw toApiError(refreshErr);
              })
              .finally(() => {
                refreshPromise = null;
              });
          }

          try {
            const newAccessToken = await refreshPromise;
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
            } else {
              (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            }
            return await http(originalRequest);
          } catch (replayErr) {
            return Promise.reject(toApiError(replayErr));
          }
        }

        // 401 without retry capability
        onUnauthorized();
      }

      return Promise.reject(toApiError(error));
    },
  );

  return http;
};
