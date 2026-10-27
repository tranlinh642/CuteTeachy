'use client';

import type { CreateTimetableSlotInput, ID, PatchTimetableSlotResult, TimetableSlot, UpdateTimetableSlotInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { createSyncQueryFn, handleGoneError } from '@/lib/sync';

export function useTimetableSlots(params?: { updatedSince?: string }) {
  const { timetableSlots } = useServices();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.timetableSlots.list();

  return useQuery<TimetableSlot[], ApiError>({
    queryKey,
    queryFn: createSyncQueryFn(queryClient, queryKey, (updatedSince) =>
      timetableSlots.list({
        updatedSince: params?.updatedSince ?? updatedSince,
      }),
    ),
  });
}

export function useCreateTimetableSlot() {
  const { timetableSlots } = useServices();
  const queryClient = useQueryClient();

  return useMutation<TimetableSlot, ApiError, CreateTimetableSlotInput>({
    mutationFn: (input) => timetableSlots.create(input),
    onSuccess: (slot) => {
      queryClient.setQueryData<TimetableSlot[]>(queryKeys.timetableSlots.list(), (list = []) => {
        const exists = list.some((item) => item.id === slot.id);
        return exists ? list.map((item) => (item.id === slot.id ? slot : item)) : [...list, slot];
      });
      // Buổi sinh từ slot thay đổi -> invalidate lịch và chi tiết buổi
      queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
    },
    onError: (error, variables) => {
      if (variables.id) {
        handleGoneError(error, {
          queryClient,
          queryKey: queryKeys.timetableSlots.list(),
          entityId: variables.id,
        });
      }
    },
  });
}

export function useUpdateTimetableSlot() {
  const { timetableSlots } = useServices();
  const queryClient = useQueryClient();

  return useMutation<PatchTimetableSlotResult, ApiError, { id: ID; input: UpdateTimetableSlotInput }>({
    mutationFn: ({ id, input }) => timetableSlots.update(id, input),
    onSuccess: (result) => {
      queryClient.setQueryData<TimetableSlot[]>(queryKeys.timetableSlots.list(), (list = []) => {
        if (result.previous) {
          // Khi tách: slot cũ kết thúc hôm qua, slot mới bắt đầu từ hôm nay
          let updated = list.map((item) => (item.id === result.previous!.id ? result.previous! : item));
          const currentExists = updated.some((item) => item.id === result.current.id);
          if (!currentExists) {
            updated = [...updated, result.current];
          }
          return updated;
        }
        return list.map((item) => (item.id === result.current.id ? result.current : item));
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
    },
    onError: (error, variables) => {
      handleGoneError(error, {
        queryClient,
        queryKey: queryKeys.timetableSlots.list(),
        entityId: variables.id,
      });
    },
  });
}

export function useDeleteTimetableSlot() {
  const { timetableSlots } = useServices();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => timetableSlots.remove(id),
    onSuccess: () => {
      // Invalidate timetable slots để fetch lại trạng thái cập nhật (ngừng hoặc xoá)
      queryClient.invalidateQueries({ queryKey: queryKeys.timetableSlots.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
    },
    onError: (error, id) => {
      handleGoneError(error, {
        queryClient,
        queryKey: queryKeys.timetableSlots.list(),
        entityId: id,
      });
    },
  });
}
