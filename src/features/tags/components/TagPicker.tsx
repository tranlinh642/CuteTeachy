'use client';

import { useTags } from '../api';
import { useTranslation } from '@/lib/i18n';
import type { ID, Tag } from '@/types';
import { useState } from 'react';
import { Chip, Icon, toneClasses } from '@/components/ui';
import { cn } from '@/utils/cn';
import { TagCreatorDialog } from './TagCreatorDialog';
import { TagEditorDialog } from './TagEditorDialog';

export interface TagPickerProps {
  readonly label: string;
  readonly selectedIds: readonly ID[];
  readonly onChange: (tagIds: ID[]) => void;
}

/** Chọn nhiều thẻ (chip bật/tắt) + nút sửa thẻ + nút "Thêm thẻ" mở hộp thoại tạo thẻ. */
export function TagPicker({ label, selectedIds, onChange }: TagPickerProps) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const toggle = (id: ID) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);

  const handleDeleted = (deletedId: ID) => {
    if (selectedIds.includes(deletedId)) {
      onChange(selectedIds.filter((value) => value !== deletedId));
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label-md text-on-surface-variant mb-2 tracking-wider uppercase">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <div
              key={tag.id}
              className={cn(
                'text-body-sm inline-flex min-h-touch items-center rounded-full border-2 transition-colors',
                toneClasses[tag.tone].bg,
                toneClasses[tag.tone].fg,
                selected ? 'border-current' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(tag.id)}
                className="inline-flex min-h-touch items-center gap-1 pl-3.5 pr-1.5 py-1 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-l-full"
              >
                {selected && <span aria-hidden>✓</span>}
                {tag.name}
              </button>
              <button
                type="button"
                aria-label={t('tags.editTag', { name: tag.name })}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingTag(tag);
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 rounded-r-full opacity-70 hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
              >
                <Icon name="edit" size={16} />
              </button>
            </div>
          );
        })}
        <Chip label={t('tags.addTag')} icon="add" onClick={() => setCreatorOpen(true)} />
      </div>
      <TagCreatorDialog
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={(tag) => onChange([...selectedIds, tag.id])}
      />
      <TagEditorDialog
        open={editingTag !== null}
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onDeleted={handleDeleted}
      />
    </fieldset>
  );
}
