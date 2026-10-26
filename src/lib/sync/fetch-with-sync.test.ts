import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/api-error';
import { createMemoryStorage } from '@/stores';
import type { SyncEnvelope } from '@/types';
import { createSyncQueryFn, fetchWithSync } from './fetch-with-sync';
import { getStoredServerTime, setStoredServerTime } from './server-time-storage';

interface TestRecord {
  id: string;
  name: string;
}

describe('fetchWithSync', () => {
  const queryKey = ['test-records'];

  it('performs full reload when no checkpoint exists', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const envelope: SyncEnvelope<TestRecord> = {
      items: [
        { id: '1', name: 'Record 1' },
        { id: '2', name: 'Record 2' },
      ],
      deletedIds: [],
      serverTime: '2026-10-26T10:00:00Z',
    };
    const fetchFn = vi.fn().mockResolvedValue(envelope);

    const result = await fetchWithSync({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(fetchFn).toHaveBeenCalledWith(undefined);
    expect(result.isFullReload).toBe(true);
    expect(result.items).toEqual(envelope.items);
    expect(queryClient.getQueryData(queryKey)).toEqual(envelope.items);

    const checkpoint = await getStoredServerTime(queryKey, storage);
    expect(checkpoint).toBe('2026-10-26T10:00:00Z');
  });

  it('sends updatedSince and applies delta when checkpoint is present', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const initialTime = '2026-10-26T10:00:00Z';
    await setStoredServerTime(queryKey, initialTime, storage);

    queryClient.setQueryData<TestRecord[]>(queryKey, [
      { id: '1', name: 'Record 1' },
      { id: '2', name: 'Record 2' },
    ]);

    const deltaEnvelope: SyncEnvelope<TestRecord> = {
      items: [
        { id: '2', name: 'Record 2 (Modified)' },
        { id: '3', name: 'Record 3 (New)' },
      ],
      deletedIds: ['1'],
      serverTime: '2026-10-26T11:00:00Z',
    };
    const fetchFn = vi.fn().mockResolvedValue(deltaEnvelope);

    const result = await fetchWithSync({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(fetchFn).toHaveBeenCalledWith(initialTime);
    expect(result.isFullReload).toBe(false);
    expect(result.items).toEqual([
      { id: '2', name: 'Record 2 (Modified)' },
      { id: '3', name: 'Record 3 (New)' },
    ]);

    const checkpoint = await getStoredServerTime(queryKey, storage);
    expect(checkpoint).toBe('2026-10-26T11:00:00Z');
  });

  it('resets checkpoint and triggers full reload when updatedSince is rejected with 400 validation (>30 days)', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const staleTime = '2026-09-01T00:00:00Z'; // > 30 days old
    await setStoredServerTime(queryKey, staleTime, storage);

    queryClient.setQueryData<TestRecord[]>(queryKey, [
      { id: '1', name: 'Old record 1' },
      { id: 'old-ghost', name: 'Deleted while client was away' },
    ]);

    const fullEnvelope: SyncEnvelope<TestRecord> = {
      items: [
        { id: '1', name: 'Current record 1' },
        { id: '4', name: 'Brand new record' },
      ],
      deletedIds: [],
      serverTime: '2026-10-26T12:00:00Z',
    };

    const fetchFn = vi.fn().mockImplementation((updatedSince?: string) => {
      if (updatedSince) {
        return Promise.reject(new ApiError('validation', 'updatedSince cannot be older than 30 days', 400));
      }
      return Promise.resolve(fullEnvelope);
    });

    const result = await fetchWithSync({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenNthCalledWith(1, staleTime);
    expect(fetchFn).toHaveBeenNthCalledWith(2, undefined);

    expect(result.isFullReload).toBe(true);
    expect(result.items).toEqual(fullEnvelope.items);
    // Old ghost item was completely purged by full reload
    expect(queryClient.getQueryData(queryKey)).toEqual(fullEnvelope.items);

    const checkpoint = await getStoredServerTime(queryKey, storage);
    expect(checkpoint).toBe('2026-10-26T12:00:00Z');
  });

  it('does not clear checkpoint on non-400 errors (e.g. 500 or 401)', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const checkpointTime = '2026-10-26T10:00:00Z';
    await setStoredServerTime(queryKey, checkpointTime, storage);

    const fetchFn = vi.fn().mockRejectedValue(new ApiError('unauthorized', 'Unauthorized', 401));

    await expect(
      fetchWithSync({
        queryClient,
        queryKey,
        fetchFn,
        storage,
      }),
    ).rejects.toMatchObject({ code: 'unauthorized', status: 401 });

    const stored = await getStoredServerTime(queryKey, storage);
    expect(stored).toBe(checkpointTime);
  });

  it('createSyncQueryFn integrates cleanly with query runners', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const envelope: SyncEnvelope<TestRecord> = {
      items: [{ id: '99', name: 'Integrated' }],
      deletedIds: [],
      serverTime: '2026-10-26T15:00:00Z',
    };
    const fetchFn = vi.fn().mockResolvedValue(envelope);

    const queryFn = createSyncQueryFn(queryClient, queryKey, fetchFn, storage);
    const data = await queryFn();

    expect(data).toEqual(envelope.items);
    expect(queryClient.getQueryData(queryKey)).toEqual(envelope.items);
  });
});
