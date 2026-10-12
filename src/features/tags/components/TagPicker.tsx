'use client';

import { useTags } from '../api';
import { useTranslation } from '@/lib/i18n';
import type { ID } from '@/types';
import { useState } from 'react';
import { Chip, toneClasses } from '@/components/ui';
import { cn } from '@/utils/cn';
import { TagCreatorDialog } from './TagCreatorDialog';

export interface TagPickerProps {
  readonly label: string;
  readonly selectedIds: readonly ID[];
  readonly onChange: (tagIds: ID[]) => void;
}

/** Chọn nhiều thẻ (chip bật/tắt) + nút "Thêm thẻ" mở hộp thoại tạo thẻ. */
export function TagPicker({ label, selectedIds, onChange }: TagPickerProps) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const toggle = (id: ID) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label-md text-on-surface-variant mb-2 tracking-wider uppercase">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(tag.id)}
              className={cn(
                'text-body-sm inline-flex min-h-touch items-center gap-1 rounded-full border-2 px-4 font-bold transition-colors',
                toneClasses[tag.tone].bg,
                toneClasses[tag.tone].fg,
                selected ? 'border-current' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              {selected && <span aria-hidden>✓</span>}
              {tag.name}
            </button>
          );
        })}
        <Chip label={t('tags.addTag')} icon="add" onClick={() => setCreatorOpen(true)} />
      </div>
      <TagCreatorDialog
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={(tag) => onChange([...selectedIds, tag.id])}
      />
    </fieldset>
  );
}
