import type { Locale } from '@/types';
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { mockRoutes } from './handlers';
import { createMockDb, type MockDb } from './mock-db';
import {
  forbidden,
  matchRoute,
  notFound,
  unauthorized,
  type HttpMethod,
  type MockResponse,
} from './mock-router';

export interface MockAdapterOptions {
  readonly latencyMs?: number;
  readonly db?: MockDb;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const parseBody = (data: unknown): unknown => {
  if (typeof data !== 'string' || data.length === 0) return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const toQuery = (params: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries((params ?? {}) as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );

/**
 * Axios adapter that answers requests from an in-memory DB, so services and
 * hooks run unchanged against mock data or the real NestJS backend.
 */
export const createMockAdapter = ({ latencyMs = 350, db = createMockDb() }: MockAdapterOptions = {}): AxiosAdapter =>
  async (config) => {
    await delay(latencyMs);

    const headers = AxiosHeaders.from(config.headers);
    const method = (config.method ?? 'get').toUpperCase() as HttpMethod;
    const path = new URL(config.url ?? '/', 'http://mock.local').pathname;
    const match = matchRoute(mockRoutes, method, path);

    let result: MockResponse;
    if (!match) {
      result = notFound();
    } else if (!match.route.isPublic && !headers.get('Authorization')) {
      result = unauthorized();
    } else if (
      !match.route.isPublic &&
      !path.startsWith('/auth/') &&
      db.user.onboardingCompletedAt === null
    ) {
      result = forbidden('onboarding_required', 'Onboarding required');
    } else {
      result = match.route.handler(
        {
          method,
          params: match.params,
          query: { ...Object.fromEntries(new URL(config.url ?? '/', 'http://mock.local').searchParams), ...toQuery(config.params) },
          body: parseBody(config.data),
          locale: (headers.get('Accept-Language') as Locale | undefined) ?? 'vi',
        },
        db,
      );
    }

    const response: AxiosResponse = {
      // Clone so UI code can never mutate the mock DB by reference.
      data: result.data === undefined ? undefined : JSON.parse(JSON.stringify(result.data)),
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
      request: {},
    };

    if (result.status >= 400) {
      throw new AxiosError(`Mock request failed with status ${result.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response);
    }
    return response;
  };
