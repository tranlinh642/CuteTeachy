import type { Locale } from '@cute-teachy/types';

/** NestJS dev server (web dev runs on :3000, so the BE uses :4000). */
export const DEFAULT_API_URL = 'http://localhost:4000';

export type ApiMode = 'mock' | 'http';

export interface ApiConfig {
  /** Base URL of the NestJS API, from `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL`. */
  readonly baseURL?: string;
  /** `mock` serves seeded in-memory data until the BE is available. */
  readonly mode?: ApiMode;
  /** Simulated latency for the mock adapter (ms). */
  readonly mockLatencyMs?: number;
  readonly timeoutMs?: number;
  readonly getAccessToken?: () => string | null;
  readonly getLocale?: () => Locale;
  /** Called on HTTP 401 – typically clears the session and redirects to login. */
  readonly onUnauthorized?: () => void;
}
