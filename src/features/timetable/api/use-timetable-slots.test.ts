import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import type { SyncEnvelope, TimetableSlot } from '@/types';
import { fetchWithSync, getStoredServerTime } from '@/lib/sync';

describe('useTimetableSlots Sync Contract (S4-FE-01)', () => {
  let queryClient: QueryClient;
  const queryKey = queryKeys.timetableSlots.list();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('fetches timetable slots and stores serverTime checkpoint', async () => {
    const storage = createMemoryStorage();
    const serverTime = '2026-10-26T12:00:00.000Z';

    const mockEnvelope: SyncEnvelope<TimetableSlot> = {
      items: [
        {
          id: 'slot-1',
          weekday: 1,
          startTime: '09:00',
          endTime: '10:30',
          subject: 'Sinh học',
          tone: 'blue',
          effectiveFrom: '2026-01-01',
          updatedAt: '2026-10-26T00:00:00Z',
        },
      ],
      deletedIds: [],
      serverTime,
    };

    const fetchFn = vi.fn().mockResolvedValue(mockEnvelope);

    const result = await fetchWithSync<TimetableSlot>({
      queryClient,
      queryKey,
      fetchFn,
      storage,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('slot-1');
    expect(fetchFn).toHaveBeenCalledWith(undefined);

    const stored = await getStoredServerTime(queryKey, storage);
    expect(stored).toBe(serverTime);
  });
});
