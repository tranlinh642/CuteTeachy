import { useMemo, useState } from 'react';
import { useDeleteNote, useNotes, useTags, useUpdateNote } from '@cute-teachy/api';
import { filterNotes, resolveTags } from '@cute-teachy/core';
import type { ID, Note } from '@cute-teachy/types';

export function useNotesList() {
  const [query, setQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<ID | null>(null);

  const notesQuery = useNotes();
  const { data: tags = [] } = useTags();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const allNotes = notesQuery.data ?? [];

  const filteredNotes = useMemo(
    () => filterNotes(allNotes, { tagId: selectedTagId, query }),
    [allNotes, selectedTagId, query],
  );

  const toggleChecklistItem = (note: Note, itemId: ID) => {
    const updatedChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    const allDone = updatedChecklist.length > 0 && updatedChecklist.every((item) => item.done);
    updateNote.mutate({
      id: note.id,
      input: {
        checklist: updatedChecklist,
        completed: allDone,
      },
    });
  };

  return {
    query,
    setQuery,
    selectedTagId,
    setSelectedTagId,
    tags,
    notes: filteredNotes,
    tagsFor: (tagIds: readonly string[]) => resolveTags(tagIds, tags),
    toggleChecklistItem,
    deleteNote: (id: ID) => deleteNote.mutate(id),
    isLoading: notesQuery.isPending,
    refetch: () => void notesQuery.refetch(),
  };
}
