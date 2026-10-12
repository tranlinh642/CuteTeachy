'use client';

import { useEffect, useState } from 'react';
import { useCreateNote, useUpdateNote } from '../api';
import { createId, noteSchema, validate, type FieldErrors, type NoteFormValues } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ChecklistItem, ID, ISODate, Note } from '@/types';
import { DateField } from '@/components/pickers';
import { Button, Checkbox, Dialog, IconButton, TextArea, TextField } from '@/components/ui';
import { TagPicker } from '@/features/tags';
import { useFieldErrorText } from '@/hooks';

export interface NoteDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly note?: Note;
}

export function NoteDialog({ open, onClose, note }: NoteDialogProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [tagIds, setTagIds] = useState<ID[]>([]);
  const [dueDate, setDueDate] = useState<ISODate | undefined>(undefined);
  const [errors, setErrors] = useState<FieldErrors<NoteFormValues>>({});

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content ?? '');
      setChecklist([...note.checklist]);
      setTagIds([...note.tagIds]);
      setDueDate(note.dueDate);
    } else {
      setTitle('');
      setContent('');
      setChecklist([]);
      setTagIds([]);
      setDueDate(undefined);
    }
    setNewChecklistText('');
    setErrors({});
  }, [note, open]);

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    setChecklist((items) => [...items, { id: createId(), text: trimmed, done: false }]);
    setNewChecklistText('');
  };

  const removeChecklistItem = (id: ID) => {
    setChecklist((items) => items.filter((i) => i.id !== id));
  };

  const toggleChecklistItem = (id: ID) => {
    setChecklist((items) =>
      items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
    if (note) {
      await updateNote.mutateAsync({ id: note.id, input: result.data });
    } else {
      await createNote.mutateAsync(result.data);
    }
    onClose();
  };

  const isSubmitting = createNote.isPending || updateNote.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={note ? t('notes.editor.editTitle') : t('notes.editor.createTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t('notes.editor.save')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label={t('notes.editor.titleLabel')}
          placeholder={t('notes.editor.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={formatError(errors.title, t('notes.editor.titleLabel'))}
          required
          data-autofocus
        />

        <TextArea
          label={t('notes.editor.contentLabel')}
          placeholder={t('notes.editor.contentPlaceholder')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          error={formatError(errors.content, t('notes.editor.contentLabel'))}
        />

        {/* Mục kiểm tra Checklist */}
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 border border-outline-variant/40">
          <label className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
            {t('notes.editor.checklistLabel')}
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChecklistItem();
                }
              }}
              placeholder={t('notes.editor.addChecklistItem')}
              className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface focus:outline-primary"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="add"
              onClick={addChecklistItem}
            >
              {t('notes.editor.addChecklistItem')}
            </Button>
          </div>

          {checklist.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-outline-variant/30">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    onChange={() => toggleChecklistItem(item.id)}
                    label={item.text}
                    hideLabel
                  />
                  <span
                    className={`flex-1 text-body-sm text-on-surface ${item.done ? 'line-through opacity-60' : ''}`}
                  >
                    {item.text}
                  </span>
                  <IconButton
                    icon="delete"
                    size="sm"
                    aria-label={t('common.actions.delete')}
                    onClick={() => removeChecklistItem(item.id)}
                    className="hover:text-error"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <TagPicker
          label={t('notes.editor.tagsLabel')}
          selectedIds={tagIds}
          onChange={setTagIds}
        />

        <DateField
          label={t('tasks.editor.dateLabel')}
          value={dueDate}
          onChange={setDueDate}
        />
      </form>
    </Dialog>
  );
}
