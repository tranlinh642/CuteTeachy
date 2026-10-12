import type { ApiMode } from './api.config';

const resolveMode = (value: string | undefined): ApiMode => (value === 'http' ? 'http' : 'mock');

export const env = {
  apiMode: resolveMode(process.env.NEXT_PUBLIC_API_MODE),
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

/** `true` khi dùng backend giả lập (hiện gợi ý tài khoản dùng thử). */
export const isMockApi = env.apiMode === 'mock';
