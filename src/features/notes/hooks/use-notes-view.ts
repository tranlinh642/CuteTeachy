'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDeleteNote, useNotes, useUpdateNote } from '../api';
import { useTags } from '@/features/tags';
import { useDebounce } from '@/hooks';
import { resolveTags } from '@/utils';
import type { ID, Note } from '@/types';

export function readNoteIdFromSearch(search?: string): ID | null {
  const rawSearch =
    search !== undefined
      ? search
      : typeof window !== 'undefined' && window.location?.search
        ? window.location.search
        : '';

  if (!rawSearch) return null;
  try {
    const params = new URLSearchParams(rawSearch);
    const noteId = params.get('noteId');
    return noteId && noteId.trim() !== '' ? noteId.trim() : null;
  } catch {
    return null;
  }
}

export function useNotesView(initialNoteId?: ID | null) {
  const [query, setQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<ID | null>(null);
  const [highlightedNoteId, setHighlightedNoteId] = useState<ID | null>(
    () => initialNoteId ?? readNoteIdFromSearch(),
  );

  useEffect(() => {
    if (initialNoteId !== undefined) {
      setHighlightedNoteId(initialNoteId);
      return;
    }

    const syncFromLocation = () => {
      setHighlightedNoteId(readNoteIdFromSearch());
    };

    syncFromLocation();
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', syncFromLocation);
      return () => window.removeEventListener('popstate', syncFromLocation);
    }
    return undefined;
  }, [initialNoteId]);

  const debouncedQuery = useDebounce(query, 300);

  const notesQuery = useNotes({
    q: debouncedQuery,
    tagId: selectedTagId,
  });

  const { data: tags = [] } = useTags();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Flattens loaded pages from infinite query; no client-side filtering/searching
  const notes = useMemo(() => {
    return notesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  }, [notesQuery.data]);

  const toggleChecklistItem = (note: Note, itemId: ID) => {
    const updatedChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    // Send only checklist; completed status is computed by the server domain rule
    updateNote.mutate({
      id: note.id,
      input: {
        checklist: updatedChecklist,
      },
    });
  };

  return {
    query,
    setQuery,
    selectedTagId,
    setSelectedTagId,
    highlightedNoteId,
    setHighlightedNoteId,
    tags,
    notes,
    tagsFor: (tagIds: readonly string[]) => resolveTags(tagIds, tags),
    toggleChecklistItem,
    deleteNote: (id: ID) => deleteNote.mutate(id),
    isLoading: notesQuery.isPending,
    isFetchingNextPage: notesQuery.isFetchingNextPage,
    hasNextPage: Boolean(notesQuery.hasNextPage),
    fetchNextPage: () => {
      if (notesQuery.hasNextPage && !notesQuery.isFetchingNextPage) {
        void notesQuery.fetchNextPage();
      }
    },
  };
}
