'use client';

import type { ClassSession, Inspiration } from '@cute-teachy/types';
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../http/api-error';
import { useServices } from '../provider/services-context';
import { queryKeys } from '../query/query-keys';
import type { DateRange } from '../services/service.types';

export function useClasses(range: DateRange) {
  const { classes } = useServices();
  return useQuery<ClassSession[], ApiError>({
    queryKey: queryKeys.classes.list(range),
    queryFn: () => classes.list(range),
  });
}

export function useTodayInspiration() {
  const { inspirations } = useServices();
  return useQuery<Inspiration, ApiError>({
    queryKey: queryKeys.inspirations.today,
    queryFn: () => inspirations.today(),
    staleTime: 60 * 60_000,
  });
}
