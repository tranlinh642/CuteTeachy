'use client';

import type { Inspiration } from '@/types';
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export function useTodayInspiration() {
  const { inspirations } = useServices();
  return useQuery<Inspiration, ApiError>({
    queryKey: queryKeys.inspirations.today,
    queryFn: () => inspirations.today(),
    staleTime: 60 * 60_000,
  });
}
