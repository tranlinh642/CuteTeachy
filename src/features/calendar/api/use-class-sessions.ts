'use client';

import type {
  ClassSession,
  CreateClassSessionInput,
  ID,
  PrepItem,
  UpdateClassSessionInput,
} from '@/types';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { handleGoneError, isGoneError, removeEntityFromCache } from '@/lib/sync';

export interface UpdateClassSessionVariables {
  readonly id: ID;
  readonly input: UpdateClassSessionInput;
}

export interface MutationContext {
  readonly snapshot: [readonly unknown[], ClassSession[] | undefined][];
}

/** Toggles a prep item's done status without mutating original array. */
export const togglePrepItemHelper = (
  session: Pick<ClassSession, 'prepItems'>,
  itemId: ID,
): PrepItem[] => {
  return session.prepItems.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
};

export const useUpdateClassSessionMutationOptions = (
  service: { update: (id: ID, input: UpdateClassSessionInput) => Promise<ClassSession> },
  queryClient: QueryClient,
) => ({
  mutationFn: ({ id, input }: UpdateClassSessionVariables) => service.update(id, input),
  onMutate: async ({ id, input }: UpdateClassSessionVariables): Promise<MutationContext> => {
    await queryClient.cancelQueries({ queryKey: queryKeys.classSessions.all });
    const snapshot = queryClient.getQueriesData<ClassSession[]>({
      queryKey: queryKeys.classSessions.all,
    });

    queryClient.setQueriesData<ClassSession[]>(
      { queryKey: queryKeys.classSessions.all },
      (list) =>
        list?.map((session) => {
          if (session.id !== id) return session;
          return {
            ...session,
            ...input,
            prepItems: input.prepItems ?? session.prepItems,
          };
        }),
    );

    return { snapshot };
  },
  onError: (
    error: ApiError | Error,
    { id }: UpdateClassSessionVariables,
    context?: MutationContext,
  ) => {
    if (isGoneError(error)) {
      queryClient.setQueriesData<ClassSession[]>(
        { queryKey: queryKeys.classSessions.all },
        (list) => list?.filter((item) => item.id !== id),
      );
      removeEntityFromCache(queryClient, queryKeys.classSessions.all, id);
      return;
    }
    context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
  },
});

export const useDeleteClassSessionMutationOptions = (
  service: { remove: (id: ID) => Promise<void> },
  queryClient: QueryClient,
) => ({
  mutationFn: (id: ID) => service.remove(id),
  onMutate: async (id: ID): Promise<MutationContext> => {
    await queryClient.cancelQueries({ queryKey: queryKeys.classSessions.all });
    const snapshot = queryClient.getQueriesData<ClassSession[]>({
      queryKey: queryKeys.classSessions.all,
    });
    queryClient.setQueriesData<ClassSession[]>(
      { queryKey: queryKeys.classSessions.all },
      (list) => list?.filter((item) => item.id !== id),
    );
    removeEntityFromCache(queryClient, queryKeys.classSessions.all, id);
    return { snapshot };
  },
  onError: (
    _error: ApiError | Error,
    _id: ID,
    context?: MutationContext,
  ) => {
    context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
  },
});

/** Hook for updating class session (topic, prepItems, cancelled for generated, or all fields for adhoc). */
export function useUpdateClassSession() {
  const { classSessions } = useServices();
  const queryClient = useQueryClient();
  return useMutation(useUpdateClassSessionMutationOptions(classSessions, queryClient));
}

/** Hook for creating an ad-hoc class session. */
export function useCreateAdHocSession() {
  const { classSessions } = useServices();
  const queryClient = useQueryClient();

  return useMutation<ClassSession, ApiError, CreateClassSessionInput>({
    mutationFn: (input) => classSessions.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
    },
    onError: (error, variables) => {
      if (variables.id) {
        handleGoneError(error, {
          queryClient,
          queryKey: queryKeys.classSessions.all,
          entityId: variables.id,
        });
      }
    },
  });
}

/** Hook for deleting an ad-hoc class session. */
export function useDeleteClassSession() {
  const { classSessions } = useServices();
  const queryClient = useQueryClient();
  return useMutation(useDeleteClassSessionMutationOptions(classSessions, queryClient));
}

/** Helper hook for toggling a prep item on a session. */
export function useTogglePrepItem() {
  const update = useUpdateClassSession();
  return {
    ...update,
    toggle: (session: ClassSession, itemId: ID) =>
      update.mutate({
        id: session.id,
        input: { prepItems: togglePrepItemHelper(session, itemId) },
      }),
  };
}

/** Helper hook for cancelling a class session. */
export function useCancelClassSession() {
  const update = useUpdateClassSession();
  return {
    ...update,
    cancel: (id: ID) => update.mutate({ id, input: { cancelled: true } }),
  };
}

/** Helper hook for restoring a cancelled class session. */
export function useRestoreClassSession() {
  const update = useUpdateClassSession();
  return {
    ...update,
    restore: (id: ID) => update.mutate({ id, input: { cancelled: false } }),
  };
}
