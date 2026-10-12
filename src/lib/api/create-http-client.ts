import { getAccessToken, usePreferencesStore, useSessionStore } from '@/stores';
import axios, { type AxiosInstance } from 'axios';
import { DEFAULT_API_URL, type ApiConfig } from '@/config';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { toApiError } from './api-error';

/**
 * Shared Axios instance for web & mobile.
 *  - request:  attaches `Authorization: Bearer <token>` and `Accept-Language`
 *  - response: normalises errors to `ApiError`, triggers `onUnauthorized` on 401
 *  - mode "mock": swaps the transport for the in-memory mock adapter
 */
export const createHttpClient = (config: ApiConfig = {}): AxiosInstance => {
  const {
    baseURL = DEFAULT_API_URL,
    mode = 'mock',
    mockLatencyMs = 350,
    timeoutMs = 15_000,
    getAccessToken: readToken = getAccessToken,
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
    const token = readToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    request.headers.set('Accept-Language', getLocale());
    return request;
  });

  http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error);
      if (apiError.code === 'unauthorized') onUnauthorized();
      return Promise.reject(apiError);
    },
  );

  return http;
};
