import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/api-error';

const NO_RETRY_CODES = new Set(['unauthorized', 'not_found', 'validation', 'invalid_credentials']);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Giữ cache 7 ngày khớp với maxAge của IndexedDB persister để phục vụ chế độ ngoại tuyến
        gcTime: 1000 * 60 * 60 * 24 * 7,
        networkMode: 'offlineFirst',
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && NO_RETRY_CODES.has(error.code)) && failureCount < 2,
      },
      mutations: {
        networkMode: 'offlineFirst',
        // Tự động thử lại tối đa 3 lần khi phục hồi kết nối mạng
        retry: (failureCount, error) =>
          !(error instanceof ApiError && NO_RETRY_CODES.has(error.code)) && failureCount < 3,
      },
    },
  });
