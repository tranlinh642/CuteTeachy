import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useCreateNote, useNotes, useUpdateNote } from '@cute-teachy/api';
import { createId, noteSchema, validate, type FieldErrors, type NoteFormValues } from '@cute-teachy/core';
import type { ChecklistItem, ID, ISODate } from '@cute-teachy/types';

export interface UseNoteFormOptions {
  readonly id?: ID;
}

export function useNoteForm({ id }: UseNoteFormOptions = {}) {
  const router = useRouter();
  const { data: notes = [] } = useNotes();
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [tagIds, setTagIds] = useState<ID[]>([]);
  const [dueDate, setDueDate] = useState<ISODate | undefined>(undefined);
  const [errors, setErrors] = useState<FieldErrors<NoteFormValues>>({});

  const existing = id ? notes.find((n) => n.id === id) : undefined;

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content ?? '');
      setChecklist([...existing.checklist]);
      setTagIds([...existing.tagIds]);
      setDueDate(existing.dueDate);
    }
  }, [existing]);

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    setChecklist((items) => [...items, { id: createId(), text: trimmed, done: false }]);
    setNewChecklistText('');
  };

  const removeChecklistItem = (itemId: ID) => {
    setChecklist((items) => items.filter((i) => i.id !== itemId));
  };

  const toggleChecklistItem = (itemId: ID) => {
    setChecklist((items) =>
      items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    );
  };

  const submit = async () => {
    const result = validate(noteSchema, {
      title,
      content: content || undefined,
      checklist,
      tagIds,
      dueDate,
    });

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    if (id) {
      await updateMutation.mutateAsync({ id, input: result.data });
    } else {
      await createMutation.mutateAsync(result.data);
    }
    router.back();
  };

  return {
    isEdit: Boolean(id),
    title,
    setTitle,
    content,
    setContent,
    checklist,
    newChecklistText,
    setNewChecklistText,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
    tagIds,
    setTagIds,
    dueDate,
    setDueDate,
    errors,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submit,
  };
}
