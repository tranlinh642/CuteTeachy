'use client';

import type { TimetableSlot } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { createSyncQueryFn } from '@/lib/sync';

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
