'use client';

import type { CreateTagInput, ID, Tag, UpdateTagInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { createSyncQueryFn, handleGoneError, removeEntityFromCache } from '@/lib/sync';

export function useTags() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useQuery<Tag[], ApiError>({
    queryKey: queryKeys.tags.all,
    queryFn: createSyncQueryFn(queryClient, queryKeys.tags.all, (updatedSince) => tags.list(updatedSince)),
    staleTime: 5 * 60_000,
  });
}

export function useCreateTag() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Tag, ApiError, CreateTagInput>({
    mutationFn: (input) => tags.create(input),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) => {
        const exists = list.some((item) => item.id === tag.id);
        return exists ? list.map((item) => (item.id === tag.id ? tag : item)) : [...list, tag];
      });
    },
    onError: (error, variables) => {
      if (variables.id) {
        handleGoneError(error, {
          queryClient,
          queryKey: queryKeys.tags.all,
          entityId: variables.id,
        });
      }
    },
  });
}

export function useUpdateTag() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Tag, ApiError, { id: ID; input: UpdateTagInput }>({
    mutationFn: ({ id, input }) => tags.update(id, input),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) =>
        list.map((item) => (item.id === tag.id ? tag : item)),
      );
    },
    onError: (error, variables) => {
      handleGoneError(error, {
        queryClient,
        queryKey: queryKeys.tags.all,
        entityId: variables.id,
      });
    },
  });
}

export function useDeleteTag() {
  const { tags } = useServices();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => tags.remove(id),
    onSuccess: (_data, id) => {
      removeEntityFromCache(queryClient, queryKeys.tags.all, id);
    },
  });
}
