/**
 * @cute-teachy/api – the only package that talks to the backend.
 *
 *   ApiProvider ─▶ createHttpClient (axios + interceptors) ─▶ services/*.service.ts
 *                                   └─ mode "mock" → mock/mock-adapter.ts
 *   hooks/*  (TanStack Query) ─▶ services
 */
export * from './config/api-config';
export * from './config/endpoints';
export * from './http/api-error';
export * from './http/create-http-client';
export * from './services';
export * from './query/query-keys';
export * from './query/query-client';
export * from './provider/services-context';
export * from './provider/api-provider';
export * from './hooks/use-auth';
export * from './hooks/use-tasks';
export * from './hooks/use-notes';
export * from './hooks/use-tags';
export * from './hooks/use-schedule';
export { MOCK_DEMO_CREDENTIALS } from './mock/seed/user.seed';
