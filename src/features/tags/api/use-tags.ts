'use client';

import type { CreateTagInput, ID, Tag } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';

export function useTags() {
  const { tags } = useServices();
  return useQuery<Tag[], ApiError>({
    queryKey: queryKeys.tags.all,
    queryFn: () => tags.list(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateTag() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Tag, ApiError, CreateTagInput>({
    mutationFn: (input) => tags.create(input),
    onSuccess: (tag) => queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) => [...list, tag]),
  });
}

export function useDeleteTag() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => tags.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),
  });
}
