import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import type { ClassSession } from '@/types';
import { ApiError } from '@/lib/api/api-error';
import {
  useUpdateClassSessionMutationOptions,
  useDeleteClassSessionMutationOptions,
  togglePrepItemHelper,
} from './use-class-sessions';

describe('useClassSessions Mutations & Optimistic Update (S4-FE-03)', () => {
  let queryClient: QueryClient;
  const range = { from: '2026-10-26', to: '2026-10-31' };
  const queryKey = queryKeys.classSessions.list(range);

  const baseGeneratedSession: ClassSession = {
    id: 'cs_slot-1_2026-10-26',
    timetableSlotId: 'slot-1',
    subject: 'Sinh học',
    date: '2026-10-26',
    startTime: '08:00',
    endTime: '09:30',
    tone: 'blue',
    topic: 'Chủ đề gốc',
    prepItems: [{ id: 'item-1', label: 'In phiếu bài tập', done: false }],
    cancelled: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };

  const baseAdhocSession: ClassSession = {
    id: 'adhoc-uuid-1',
    timetableSlotId: null,
    subject: 'Dạy bù Tin học',
    date: '2026-10-28',
    startTime: '14:00',
    endTime: '15:30',
    tone: 'mint',
    topic: 'Lập trình Python',
    prepItems: [],
    cancelled: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('useUpdateClassSession optimistic update & rollback', () => {
    it('optimistically updates topic, prepItems, cancelled for generated session', async () => {
      queryClient.setQueryData(queryKey, [baseGeneratedSession]);

      const mockServiceUpdate = vi.fn().mockResolvedValue({
        ...baseGeneratedSession,
        topic: 'Chủ đề đã sửa',
        cancelled: true,
      });

      const options = useUpdateClassSessionMutationOptions({ update: mockServiceUpdate }, queryClient);

      // Trigger onMutate
      await options.onMutate?.({
        id: baseGeneratedSession.id,
        input: { topic: 'Chủ đề đã sửa', cancelled: true },
      });

      // Verify cache immediately updated optimistically
      const cached = queryClient.getQueryData<ClassSession[]>(queryKey);
      expect(cached?.[0]?.topic).toBe('Chủ đề đã sửa');
      expect(cached?.[0]?.cancelled).toBe(true);

      // Verify onSettled invalidation
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      options.onSettled?.();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.classSessions.all });
    });

    it('rolls back to previous snapshot when mutation fails', async () => {
      queryClient.setQueryData(queryKey, [baseGeneratedSession]);

      const mockServiceUpdate = vi.fn().mockRejectedValue(new Error('Network error'));
      const options = useUpdateClassSessionMutationOptions({ update: mockServiceUpdate }, queryClient);

      const context = await options.onMutate?.({
        id: baseGeneratedSession.id,
        input: { topic: 'Chủ đề sẽ fail' },
      });

      // Optimistic state
      expect(queryClient.getQueryData<ClassSession[]>(queryKey)?.[0]?.topic).toBe('Chủ đề sẽ fail');

      // Trigger onError
      options.onError?.(new Error('Network error'), { id: baseGeneratedSession.id, input: {} }, context);

      // Verify rollback
      expect(queryClient.getQueryData<ClassSession[]>(queryKey)?.[0]?.topic).toBe('Chủ đề gốc');
    });

    it('removes entity from cache if 410 gone error occurs', async () => {
      queryClient.setQueryData(queryKey, [baseGeneratedSession]);

      const options = useUpdateClassSessionMutationOptions({ update: vi.fn() }, queryClient);
      const context = await options.onMutate?.({
        id: baseGeneratedSession.id,
        input: { topic: 'Sẽ gone' },
      });

      const goneError = new ApiError('gone', 'Resource is gone', 410);
      options.onError?.(goneError, { id: baseGeneratedSession.id, input: {} }, context);

      const cached = queryClient.getQueryData<ClassSession[]>(queryKey);
      expect(cached).toEqual([]);
    });
  });

  describe('useDeleteClassSession optimistic delete & rollback', () => {
    it('optimistically removes adhoc session from cache', async () => {
      queryClient.setQueryData(queryKey, [baseGeneratedSession, baseAdhocSession]);

      const mockServiceRemove = vi.fn().mockResolvedValue(undefined);
      const options = useDeleteClassSessionMutationOptions({ remove: mockServiceRemove }, queryClient);

      const context = await options.onMutate?.(baseAdhocSession.id);

      // Cache immediately has adhoc session removed
      const cached = queryClient.getQueryData<ClassSession[]>(queryKey);
      expect(cached).toHaveLength(1);
      expect(cached?.[0]?.id).toBe(baseGeneratedSession.id);

      // On failure, rolls back
      options.onError?.(new Error('Failed to delete'), baseAdhocSession.id, context);
      const restored = queryClient.getQueryData<ClassSession[]>(queryKey);
      expect(restored).toHaveLength(2);
      expect(restored?.some((s) => s.id === baseAdhocSession.id)).toBe(true);
    });
  });

  describe('togglePrepItemHelper', () => {
    it('toggles item done status and keeps other items unchanged', () => {
      const sessionWithItems: ClassSession = {
        ...baseGeneratedSession,
        prepItems: [
          { id: 'item-1', label: 'Item 1', done: false },
          { id: 'item-2', label: 'Item 2', done: true },
        ],
      };

      const updated = togglePrepItemHelper(sessionWithItems, 'item-1');
      expect(updated[0]?.done).toBe(true);
      expect(updated[1]?.done).toBe(true);

      const toggledBack = togglePrepItemHelper({ ...sessionWithItems, prepItems: updated }, 'item-1');
      expect(toggledBack[0]?.done).toBe(false);
    });
  });
});
