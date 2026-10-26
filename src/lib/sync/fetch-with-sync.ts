import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ApiError } from '@/lib/api/api-error';
import type { KeyValueStorage } from '@/stores';
import type { SyncEnvelope } from '@/types';
import { applySyncEnvelopeToCache } from './apply-envelope';
import {
  getStoredServerTime,
  removeStoredServerTime,
  setStoredServerTime,
} from './server-time-storage';

export interface FetchWithSyncOptions<T extends { id: string }> {
  readonly queryClient: QueryClient;
  readonly queryKey: QueryKey | string;
  readonly fetchFn: (updatedSince?: string) => Promise<SyncEnvelope<T>>;
  readonly storage?: KeyValueStorage;
  /** Force a full reload, bypassing any stored serverTime checkpoint */
  readonly forceFull?: boolean;
}

export interface FetchWithSyncResult<T> {
  readonly envelope: SyncEnvelope<T>;
  readonly items: T[];
  readonly isFullReload: boolean;
}

const isUpdatedSinceRejected = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    return error.status === 400 || error.code === 'validation';
  }
  if (isAxiosError<{ code?: string }>(error)) {
    return error.response?.status === 400 || error.response?.data?.code === 'validation';
  }
  return false;
};

/**
 * Fetches list data using delta sync (`updatedSince`).
 *
 * Automatically recovers when `updatedSince` is rejected by the server
 * (e.g. HTTP 400 validation when checkpoint is older than 30 days):
 * it removes the stale checkpoint and reloads the full dataset.
 */
export const fetchWithSync = async <T extends { id: string }>({
  queryClient,
  queryKey,
  fetchFn,
  storage,
  forceFull = false,
}: FetchWithSyncOptions<T>): Promise<FetchWithSyncResult<T>> => {
  const key = (Array.isArray(queryKey) ? queryKey : [queryKey]) as QueryKey;
  const storedCheckpoint = forceFull ? null : await getStoredServerTime(key, storage);
  const updatedSince = storedCheckpoint ?? undefined;

  try {
    const envelope = await fetchFn(updatedSince);
    const items = await applySyncEnvelopeToCache(queryClient, key, envelope, storage);
    return {
      envelope,
      items,
      isFullReload: !updatedSince,
    };
  } catch (error) {
    if (updatedSince && isUpdatedSinceRejected(error)) {
      // 1. Invalidate stale checkpoint
      await removeStoredServerTime(key, storage);

      // 2. Perform full reload without updatedSince
      const fullEnvelope = await fetchFn(undefined);

      // 3. Completely replace cache with fresh full items
      queryClient.setQueryData(key, fullEnvelope.items);
      if (fullEnvelope.serverTime) {
        await setStoredServerTime(key, fullEnvelope.serverTime, storage);
      }

      return {
        envelope: fullEnvelope,
        items: fullEnvelope.items,
        isFullReload: true,
      };
    }

    throw error;
  }
};

/**
 * Convenience queryFn creator for TanStack Query `useQuery`.
 */
export const createSyncQueryFn = <T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey | string,
  fetchFn: (updatedSince?: string) => Promise<SyncEnvelope<T>>,
  storage?: KeyValueStorage,
): (() => Promise<T[]>) => {
  return async () => {
    const result = await fetchWithSync({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });
    return result.items;
  };
};
