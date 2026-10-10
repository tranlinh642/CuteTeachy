import type { ApiConfig, ApiMode } from '@cute-teachy/api';
import { getAccessToken, usePreferencesStore, useSessionStore } from '@cute-teachy/core';

const resolveMode = (value: string | undefined): ApiMode => (value === 'http' ? 'http' : 'mock');

/** `true` khi dùng backend giả lập (hiện gợi ý tài khoản dùng thử). */
export const isMockApi = resolveMode(process.env.NEXT_PUBLIC_API_MODE) === 'mock';

/** Cấu hình API cho web: mặc định `mock` cho tới khi backend NestJS sẵn sàng. */
export const createApiConfig = (): ApiConfig => ({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  mode: resolveMode(process.env.NEXT_PUBLIC_API_MODE),
  getAccessToken,
  getLocale: () => usePreferencesStore.getState().locale,
  // 401 → xoá phiên; AuthGuard sẽ tự chuyển về /login.
  onUnauthorized: () => useSessionStore.getState().clearSession(),
});
