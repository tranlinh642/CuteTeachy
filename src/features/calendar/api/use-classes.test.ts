import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import type { ClassSession, SyncEnvelope } from '@/types';
import { fetchWithSync, getStoredServerTime, setStoredServerTime } from '@/lib/sync';

describe('useClasses & Class Session Sync Contract (S4-FE-01)', () => {
  let queryClient: QueryClient;
  const range = { from: '2026-10-26', to: '2026-10-30' };
  const queryKey = queryKeys.classSessions.list(range);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('fetches class sessions and stores serverTime checkpoint in storage', async () => {
    const storage = createMemoryStorage();
    const serverTime = '2026-10-26T12:00:00.000Z';

    const mockEnvelope: SyncEnvelope<ClassSession> = {
      items: [
        {
          id: 'cs_slot-1_2026-10-26',
          timetableSlotId: 'slot-1',
          subject: 'Sinh học',
          date: '2026-10-26',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Phòng 302',
          tone: 'blue',
          prepItems: [],
          cancelled: false,
          updatedAt: '2026-10-26T00:00:00Z',
        },
      ],
      deletedIds: [],
      serverTime,
    };

    const fetchFn = vi.fn().mockResolvedValue(mockEnvelope);

    const result = await fetchWithSync<ClassSession>({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('cs_slot-1_2026-10-26');
    expect(fetchFn).toHaveBeenCalledWith(undefined);

    const storedTime = await getStoredServerTime(queryKey, storage);
    expect(storedTime).toBe(serverTime);
  });

  it('passes updatedSince on subsequent sync and applies delta updates', async () => {
    const storage = createMemoryStorage();
    const initialServerTime = '2026-10-26T12:00:00.000Z';
    const updatedServerTime = '2026-10-26T13:00:00.000Z';

    const session: ClassSession = {
      id: 'cs_slot-1_2026-10-26',
      timetableSlotId: 'slot-1',
      subject: 'Sinh học',
      date: '2026-10-26',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Phòng 302',
      tone: 'blue',
      prepItems: [],
      cancelled: false,
      updatedAt: '2026-10-26T00:00:00Z',
    };

    // Pre-populate cache and stored time
    queryClient.setQueryData(queryKey, [session]);
    await setStoredServerTime(queryKey, initialServerTime, storage);

    // Delta update cancels the session
    const deltaEnvelope: SyncEnvelope<ClassSession> = {
      items: [{ ...session, cancelled: true, updatedAt: '2026-10-26T12:30:00Z' }],
      deletedIds: [],
      serverTime: updatedServerTime,
    };

    const fetchFn = vi.fn().mockResolvedValue(deltaEnvelope);

    const result = await fetchWithSync<ClassSession>({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(fetchFn).toHaveBeenCalledWith(initialServerTime);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.cancelled).toBe(true);

    const updatedStoredTime = await getStoredServerTime(queryKey, storage);
    expect(updatedStoredTime).toBe(updatedServerTime);
  });
});
