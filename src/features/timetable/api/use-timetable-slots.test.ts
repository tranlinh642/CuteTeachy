import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import type { PatchTimetableSlotResult, SyncEnvelope, TimetableSlot } from '@/types';
import { fetchWithSync, getStoredServerTime } from '@/lib/sync';

describe('useTimetableSlots and mutations cache management (S4-FE-02)', () => {
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

  const sampleSlot: TimetableSlot = {
    id: 'slot-1',
    weekday: 1,
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Sinh học',
    tone: 'blue',
    effectiveFrom: '2026-01-01',
    updatedAt: '2026-10-26T00:00:00Z',
  };

  it('fetches timetable slots and stores serverTime checkpoint', async () => {
    const storage = createMemoryStorage();
    const serverTime = '2026-10-26T12:00:00.000Z';

    const mockEnvelope: SyncEnvelope<TimetableSlot> = {
      items: [sampleSlot],
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

  it('handles in-place update in query cache', () => {
    queryClient.setQueryData<TimetableSlot[]>(queryKey, [sampleSlot]);

    const updatedSlot: TimetableSlot = {
      ...sampleSlot,
      subject: 'Sinh học 11',
      room: 'Phòng 204',
      updatedAt: '2026-10-27T00:00:00Z',
    };

    queryClient.setQueryData<TimetableSlot[]>(queryKey, (list = []) =>
      list.map((item) => (item.id === updatedSlot.id ? updatedSlot : item)),
    );

    const cached = queryClient.getQueryData<TimetableSlot[]>(queryKey);
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.subject).toBe('Sinh học 11');
    expect(cached?.[0]?.room).toBe('Phòng 204');
  });

  it('handles split update in query cache by updating previous and appending current', () => {
    queryClient.setQueryData<TimetableSlot[]>(queryKey, [sampleSlot]);

    const splitResult: PatchTimetableSlotResult = {
      previous: {
        ...sampleSlot,
        effectiveTo: '2026-10-26',
        updatedAt: '2026-10-27T00:00:00Z',
      },
      current: {
        id: 'slot-2',
        weekday: 1,
        startTime: '09:00',
        endTime: '10:30',
        subject: 'Sinh học nâng cao',
        tone: 'blue',
        effectiveFrom: '2026-10-27',
        effectiveTo: null,
        updatedAt: '2026-10-27T00:00:00Z',
      },
    };

    queryClient.setQueryData<TimetableSlot[]>(queryKey, (list = []) => {
      let updated = list.map((item) => (item.id === splitResult.previous!.id ? splitResult.previous! : item));
      const currentExists = updated.some((item) => item.id === splitResult.current.id);
      if (!currentExists) {
        updated = [...updated, splitResult.current];
      }
      return updated;
    });

    const cached = queryClient.getQueryData<TimetableSlot[]>(queryKey);
    expect(cached).toHaveLength(2);
    expect(cached?.find((s) => s.id === 'slot-1')?.effectiveTo).toBe('2026-10-26');
    expect(cached?.find((s) => s.id === 'slot-2')?.subject).toBe('Sinh học nâng cao');
  });

  it('adds newly created slot to query cache', () => {
    queryClient.setQueryData<TimetableSlot[]>(queryKey, [sampleSlot]);

    const newSlot: TimetableSlot = {
      id: 'slot-new',
      weekday: 3,
      startTime: '14:00',
      endTime: '15:30',
      subject: 'Hóa học',
      tone: 'pink',
      effectiveFrom: '2026-10-27',
      effectiveTo: null,
      updatedAt: '2026-10-27T00:00:00Z',
    };

    queryClient.setQueryData<TimetableSlot[]>(queryKey, (list = []) => [...list, newSlot]);

    const cached = queryClient.getQueryData<TimetableSlot[]>(queryKey);
    expect(cached).toHaveLength(2);
    expect(cached?.find((s) => s.id === 'slot-new')?.subject).toBe('Hóa học');
  });
});
