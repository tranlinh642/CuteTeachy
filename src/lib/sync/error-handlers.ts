import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ApiError } from '@/lib/api/api-error';

export const isGoneError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.code === 'gone' || error.status === 410;
  }
  if (isAxiosError<{ code?: string }>(error)) {
    return error.response?.status === 410 || error.response?.data?.code === 'gone';
  }
  return false;
};

export const isIdConflictError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.code === 'id_conflict';
  }
  if (isAxiosError<{ code?: string }>(error)) {
    return error.response?.data?.code === 'id_conflict';
  }
  return false;
};

/**
 * Removes an entity by ID from the TanStack Query cache.
 * Compatible with flat arrays, envelope objects (`{ items: [] }`), and infinite queries (`{ pages: [] }`).
 */
export const removeEntityFromCache = <T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey | string,
  entityId: string,
): void => {
  const key = (Array.isArray(queryKey) ? queryKey : [queryKey]) as QueryKey;

  queryClient.setQueryData(key, (old: unknown) => {
    if (!old) return old;

    // Flat array of entities
    if (Array.isArray(old)) {
      return old.filter((item: T) => item?.id !== entityId);
    }

    // Object containing items array (e.g. envelope or paginated response)
    if (typeof old === 'object' && old !== null) {
      const record = old as Record<string, unknown>;

      if (Array.isArray(record.items)) {
        return {
          ...record,
          items: (record.items as T[]).filter((item) => item?.id !== entityId),
        };
      }

      // Infinite query structure: { pages: [...], pageParams: [...] }
      if (Array.isArray(record.pages)) {
        return {
          ...record,
          pages: record.pages.map((page: unknown) => {
            if (Array.isArray(page)) {
              return page.filter((item: T) => item?.id !== entityId);
            }
            if (typeof page === 'object' && page !== null && Array.isArray((page as Record<string, unknown>).items)) {
              const pageRecord = page as Record<string, unknown>;
              return {
                ...pageRecord,
                items: (pageRecord.items as T[]).filter((item) => item?.id !== entityId),
              };
            }
            return page;
          }),
        };
      }
    }

    return old;
  });
};

export interface GoneHandlerOptions {
  readonly queryClient: QueryClient;
  readonly queryKey: QueryKey | string | readonly (QueryKey | string)[];
  readonly entityId: string;
  readonly onHandled?: () => void;
}

/**
 * Handles a 410 gone error gracefully:
 * removes the deleted record from cache and returns true.
 * Returns false if the error was not a 410 gone error.
 */
export const handleGoneError = (error: unknown, options: GoneHandlerOptions): boolean => {
  if (!isGoneError(error)) return false;

  const rawKeys = options.queryKey;
  const keyList: (QueryKey | string)[] = Array.isArray(rawKeys)
    ? Array.isArray(rawKeys[0])
      ? (rawKeys as (QueryKey | string)[])
      : [rawKeys as QueryKey]
    : [rawKeys];

  for (const key of keyList) {
    removeEntityFromCache(options.queryClient, key, options.entityId);
  }

  options.onHandled?.();
  return true;
};

/**
 * Wraps mutation execution to safely catch `410 gone` errors when creating or editing a record.
 * On 410, it purges the record from cache, calls `onGone`, and resolves with `null`
 * instead of throwing an alarming error to the user.
 */
export const executeSyncMutation = async <T>(
  mutationFn: () => Promise<T>,
  options: GoneHandlerOptions,
): Promise<T | null> => {
  try {
    return await mutationFn();
  } catch (error) {
    if (handleGoneError(error, options)) {
      return null;
    }
    throw error;
  }
};
