import type { ApiConfig } from '@cute-teachy/api';
import { getAccessToken, usePreferencesStore, useSessionStore } from '@cute-teachy/core';

/**
 * Cấu hình API cho mobile. Mặc định `mock` (dữ liệu seed) cho tới khi backend NestJS sẵn sàng;
 * đổi sang `http` và đặt `EXPO_PUBLIC_API_URL` khi cần.
 */
export const apiConfig: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  mode: 'mock',
  getAccessToken,
  getLocale: () => usePreferencesStore.getState().locale,
  // 401 → xóa phiên; Stack.Protected sẽ tự chuyển về màn hình đăng nhập
  onUnauthorized: () => useSessionStore.getState().clearSession(),
};
