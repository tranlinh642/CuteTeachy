'use client';

import type { CreateNoteInput, ID, Note, SyncEnvelope, UpdateNoteInput } from '@/types';
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import type { NoteService } from '@/lib/api/services/note.service';
import { queryKeys } from '@/lib/query';
import {
  applySyncEnvelopeToCache,
  getStoredServerTime,
  isGoneError,
  removeEntityFromCache,
  removeStoredServerTime,
  setStoredServerTime,
} from '@/lib/sync';
import type { KeyValueStorage } from '@/stores';

export interface UseNotesOptions {
  readonly q?: string;
  readonly tagId?: string | null;
}

export function useNotes(options?: UseNotesOptions) {
  const { notes } = useServices();
  const effectiveQ = options?.q?.trim() || undefined;
  const effectiveTagId = options?.tagId || undefined;

  const queryKey = queryKeys.notes.infinite({
    q: effectiveQ,
    tagId: effectiveTagId,
  });

  return useInfiniteQuery<SyncEnvelope<Note>, ApiError>({
    queryKey,
    queryFn: ({ pageParam }) =>
      notes.list({
        cursor: (pageParam as string | undefined) ?? undefined,
        limit: 20,
        q: effectiveQ,
        tagId: effectiveTagId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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

  return useMutation<Note, ApiError, { id: ID; input: UpdateNoteInput }>({
    mutationFn: ({ id, input }) => notes.update(id, input),
    onSuccess: (updatedNote) => {
      // Optimistically / immediately update note in-place across all cached infinite queries
      queryClient.setQueriesData<InfiniteData<SyncEnvelope<Note>>>(
        { queryKey: queryKeys.notes.all },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === updatedNote.id ? updatedNote : item,
              ),
            })),
          };
        },
      );
    },
    onError: (error, { id }) => {
      if (isGoneError(error)) {
        removeEntityFromCache(queryClient, queryKeys.notes.all, id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useDeleteNote() {
  const { notes } = useServices();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, ID>({
    mutationFn: (id) => notes.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all });
      removeEntityFromCache(queryClient, queryKeys.notes.all, id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

/**
 * Synchronizes delta changes (via updatedSince) and applies them to all loaded note pages in cache.
 */
export const syncNotes = async (
  queryClient: QueryClient,
  noteService: NoteService,
  storage?: KeyValueStorage,
): Promise<SyncEnvelope<Note>> => {
  const checkpointKey = queryKeys.notes.syncCheckpoint;
  const storedCheckpoint = await getStoredServerTime(checkpointKey, storage);
  const updatedSince = storedCheckpoint ?? undefined;

  try {
    const envelope = await noteService.list({ updatedSince });

    // Apply envelope to all cached infinite queries under notes
    const queries = queryClient.getQueryCache().findAll({ queryKey: queryKeys.notes.all });
    for (const query of queries) {
      if (query.queryKey[1] === 'infinite') {
        await applySyncEnvelopeToCache(queryClient, query.queryKey, envelope, storage);
      }
    }

    if (envelope.serverTime) {
      await setStoredServerTime(checkpointKey, envelope.serverTime, storage);
    }

    return envelope;
  } catch (error) {
    if (
      updatedSince &&
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as ApiError).status === 400
    ) {
      await removeStoredServerTime(checkpointKey, storage);
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    }
    throw error;
  }
};

export function useSyncNotes() {
  const { notes } = useServices();
  const queryClient = useQueryClient();
  return useMutation<SyncEnvelope<Note>, ApiError, void>({
    mutationFn: () => syncNotes(queryClient, notes),
  });
}
