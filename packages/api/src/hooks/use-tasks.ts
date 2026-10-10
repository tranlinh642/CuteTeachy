'use client';

import type { CreateTaskInput, ID, Task, UpdateTaskInput } from '@cute-teachy/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../http/api-error';
import { useServices } from '../provider/services-context';
import { queryKeys } from '../query/query-keys';
import type { DateRange } from '../services/service.types';

export function useTasks(range?: DateRange) {
  const { tasks } = useServices();
  return useQuery<Task[], ApiError>({
    queryKey: queryKeys.tasks.list(range),
    queryFn: () => tasks.list(range),
  });
}

export function useCreateTask() {
  const { tasks } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Task, ApiError, CreateTaskInput>({
    mutationFn: (input) => tasks.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
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

  return useMutation<Task, ApiError, UpdateTaskVariables, { snapshot: [readonly unknown[], Task[] | undefined][] }>({
    mutationFn: ({ id, input }) => tasks.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: queryKeys.tasks.all });
      queryClient.setQueriesData<Task[]>({ queryKey: queryKeys.tasks.all }, (list) =>
        list?.map((task) => (task.id === id ? { ...task, ...input } : task)),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useToggleTask() {
  const update = useUpdateTask();
  return {
    ...update,
    toggle: (task: Pick<Task, 'id' | 'completed'>) =>
      update.mutate({ id: task.id, input: { completed: !task.completed } }),
  };
}

export function useDeleteTask() {
  const { tasks } = useServices();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => tasks.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
