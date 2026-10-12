'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Note } from '@/types';
import { Button, Chip, EmptyState, TagChip, TextField } from '@/components/ui';
import { useNotesView } from '../hooks/use-notes-view';
import { NoteCard } from './NoteCard';
import { NoteDialog } from './NoteDialog';

export function NotesView() {
  const { t } = useTranslation();
  const {
    query,
    setQuery,
    selectedTagId,
    setSelectedTagId,
    tags,
    notes,
    tagsFor,
    toggleChecklistItem,
    deleteNote,
  } = useNotesView();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  const openCreate = () => {
    setEditingNote(undefined);
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-on-surface">{t('notes.title')}</h1>
          <p className="text-body-lg text-on-surface-variant mt-1">{t('notes.subtitle')}</p>
        </div>
        <Button variant="primary" icon="add" onClick={openCreate}>
          {t('notes.editor.createTitle')}
        </Button>
      </header>

      {/* Tìm kiếm & Lọc theo nhãn */}
      <div className="flex flex-col gap-4">
        <TextField
          label={t('notes.searchPlaceholder')}
          hideLabel
          placeholder={t('notes.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon="search"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            label={t('notes.filterAll')}
            selected={selectedTagId === null}
            onClick={() => setSelectedTagId(null)}
          />
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
              aria-pressed={selectedTagId === tag.id}
              className="focus:outline-none"
            >
              <TagChip
                name={tag.name}
                tone={tag.tone}
                className={selectedTagId === tag.id ? 'ring-2 ring-current' : 'opacity-80 hover:opacity-100'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lưới ghi chú */}
      {notes.length === 0 ? (
        <EmptyState
          icon="notes"
          title={t('notes.empty')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              tags={tagsFor(note.tagIds)}
              onToggleItem={toggleChecklistItem}
              onEdit={openEdit}
              onDelete={(n) => deleteNote(n.id)}
            />
          ))}
        </div>
      )}

      {/* Hộp thoại tạo / sửa ghi chú */}
      <NoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        note={editingNote}
      />
    </div>
  );
}
