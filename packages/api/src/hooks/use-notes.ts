'use client';

import type { CreateNoteInput, ID, Note, UpdateNoteInput } from '@cute-teachy/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../http/api-error';
import { useServices } from '../provider/services-context';
import { queryKeys } from '../query/query-keys';

export function useNotes() {
  const { notes } = useServices();
  return useQuery<Note[], ApiError>({
    queryKey: queryKeys.notes.list(),
    queryFn: () => notes.list(),
  });
}

export function useCreateNote() {
  const { notes } = useServices();
  const queryClient = useQueryClient();
  return useMutation<Note, ApiError, CreateNoteInput>({
    mutationFn: (input) => notes.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useUpdateNote() {
  const { notes } = useServices();
  const queryClient = useQueryClient();

  return useMutation<Note, ApiError, { id: ID; input: UpdateNoteInput }, { previous?: Note[] }>({
    mutationFn: ({ id, input }) => notes.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all });
      const previous = queryClient.getQueryData<Note[]>(queryKeys.notes.list());
      queryClient.setQueryData<Note[]>(queryKeys.notes.list(), (list) =>
        list?.map((note) => (note.id === id ? { ...note, ...input } : note)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notes.list(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useDeleteNote() {
  const { notes } = useServices();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => notes.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}
