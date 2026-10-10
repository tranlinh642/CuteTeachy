import type { Locale } from '@cute-teachy/types';
import type { MockDb } from './mock-db';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface MockRequest {
  readonly method: HttpMethod;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
  readonly locale: Locale;
}

export interface MockResponse {
  readonly status: number;
  readonly data?: unknown;
}

export type MockHandler = (request: MockRequest, db: MockDb) => MockResponse;

export interface MockRoute {
  readonly method: HttpMethod;
  readonly pattern: string;
  readonly handler: MockHandler;
  /** Public routes skip the Authorization check (e.g. login). */
  readonly isPublic: boolean;
}

export const route = (
  method: HttpMethod,
  pattern: string,
  handler: MockHandler,
  options: { isPublic?: boolean } = {},
): MockRoute => ({ method, pattern, handler, isPublic: options.isPublic ?? false });

/** Matches `/tasks/:id` style patterns and extracts params. */
export const matchRoute = (
  routes: readonly MockRoute[],
  method: string,
  path: string,
): { route: MockRoute; params: Record<string, string> } | null => {
  const segments = path.split('/').filter(Boolean);
  for (const candidate of routes) {
    if (candidate.method !== method) continue;
    const parts = candidate.pattern.split('/').filter(Boolean);
    if (parts.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matched = parts.every((part, index) => {
      const segment = segments[index] ?? '';
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segment);
        return true;
      }
      return part === segment;
    });
    if (matched) return { route: candidate, params };
  }
  return null;
};

/* Response helpers */
export const ok = (data: unknown): MockResponse => ({ status: 200, data });
export const created = (data: unknown): MockResponse => ({ status: 201, data });
export const noContent = (): MockResponse => ({ status: 204 });
export const notFound = (): MockResponse => ({ status: 404, data: { code: 'not_found', message: 'Not found' } });
export const badRequest = (message = 'Invalid payload'): MockResponse => ({
  status: 400,
  data: { code: 'validation', message },
});
export const unauthorized = (code = 'unauthorized'): MockResponse => ({
  status: 401,
  data: { code, message: 'Unauthorized' },
});
