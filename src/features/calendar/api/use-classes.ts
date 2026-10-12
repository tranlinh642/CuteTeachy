'use client';

import type { ClassSession } from '@/types';
import { useQuery } from '@tanstack/react-query';
import type { ApiError, DateRange } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export function useClasses(range: DateRange) {
  const { classes } = useServices();
  return useQuery<ClassSession[], ApiError>({
    queryKey: queryKeys.classes.list(range),
    queryFn: () => classes.list(range),
  });
}
