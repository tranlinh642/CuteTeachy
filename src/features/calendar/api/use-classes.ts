'use client';

import type { ClassSession } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError, DateRange } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { createSyncQueryFn } from '@/lib/sync';
import { addDays, startOfWeek, toISODate } from '@/utils';

const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const start = startOfWeek(today);
  const end = addDays(start, 41); // 42 days total (<= 42 days)
  return {
    from: toISODate(start),
    to: toISODate(end),
  };
};

export function useClasses(range?: DateRange) {
  const { classSessions } = useServices();
  const queryClient = useQueryClient();
  const effectiveRange = range ?? getDefaultDateRange();
  const queryKey = queryKeys.classSessions.list(effectiveRange);

  return useQuery<ClassSession[], ApiError>({
    queryKey,
    queryFn: createSyncQueryFn(queryClient, queryKey, (updatedSince) =>
      classSessions.list({
        from: effectiveRange.from,
        to: effectiveRange.to,
        updatedSince,
      }),
    ),
  });
}

export const useClassSessions = useClasses;
