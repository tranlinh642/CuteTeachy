import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../http/api-error';

const NO_RETRY_CODES = new Set(['unauthorized', 'not_found', 'validation', 'invalid_credentials']);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && NO_RETRY_CODES.has(error.code)) && failureCount < 2,
      },
      mutations: {
        retry: false,
      },
    },
  });
