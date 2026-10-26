"use client";

import type { CreateTaskInput, ID, Task, UpdateTaskInput } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { useServices } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { DateRange } from "@/lib/api";
import {
  createSyncQueryFn,
  handleGoneError,
  isGoneError,
  removeEntityFromCache,
} from "@/lib/sync";
import { addDays, startOfWeek, toISODate } from "@/utils";

const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const start = startOfWeek(today);
  const end = addDays(start, 41); // 42 days total (<= 42 days)
  return {
    from: toISODate(start),
    to: toISODate(end),
  };
};

export function useTasks(range?: DateRange) {
  const { tasks } = useServices();
  const queryClient = useQueryClient();
  const effectiveRange = range ?? getDefaultDateRange();
  const queryKey = queryKeys.tasks.list(range ?? effectiveRange);

  return useQuery<Task[], ApiError>({
    queryKey,
    queryFn: createSyncQueryFn(queryClient, queryKey, (updatedSince) =>
      tasks.list({
        from: effectiveRange.from,
        to: effectiveRange.to,
        updatedSince,
      }),
    ),
  });
}

export function useCreateTask() {
  const { tasks } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Task, ApiError, CreateTaskInput>({
    mutationFn: (input) => {
      return tasks.create(input);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    onError: (error, variables) => {
      if (variables.id) {
        handleGoneError(error, {
          queryClient,
          queryKey: queryKeys.tasks.all,
          entityId: variables.id,
        });
      }
    },
  });
}

interface UpdateTaskVariables {
  readonly id: ID;
  readonly input: UpdateTaskInput;
}

/** Optimistic update across every cached task list (e.g. checkbox toggle). */
export function useUpdateTask() {
  const { tasks } = useServices();
  const queryClient = useQueryClient();

  return useMutation<
    Task,
    ApiError,
    UpdateTaskVariables,
    { snapshot: [readonly unknown[], Task[] | undefined][] }
  >({
    mutationFn: ({ id, input }) => tasks.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.all,
      });
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks.all },
        (list) =>
          list?.map((task) => (task.id === id ? { ...task, ...input } : task)),
      );
      return { snapshot };
    },
    onError: (error, { id }, context) => {
      if (isGoneError(error)) {
        removeEntityFromCache(queryClient, queryKeys.tasks.all, id);
        return;
      }
      context?.snapshot.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useToggleTask() {
  const update = useUpdateTask();
  return {
    ...update,
    toggle: (task: Pick<Task, "id" | "completed">) =>
      update.mutate({ id: task.id, input: { completed: !task.completed } }),
  };
}

export function useDeleteTask() {
  const { tasks } = useServices();
  const queryClient = useQueryClient();
  return useMutation<
    void,
    ApiError,
    ID,
    { snapshot: [readonly unknown[], Task[] | undefined][] }
  >({
    mutationFn: (id) => tasks.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.all,
      });
      removeEntityFromCache(queryClient, queryKeys.tasks.all, id);
      return { snapshot };
    },
    onError: (_error, _id, context) => {
      context?.snapshot.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
