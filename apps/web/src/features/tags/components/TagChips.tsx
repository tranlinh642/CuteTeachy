'use client';

import type { ID } from '@cute-teachy/types';
import { TagChip } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useResolvedTags } from '../hooks/use-resolved-tags';

export interface TagChipsProps {
  readonly tagIds: readonly ID[];
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

/** Danh sách nhãn thẻ của một ghi chú / công việc. */
export function TagChips({ tagIds, size = 'sm', className }: TagChipsProps) {
  const tags = useResolvedTags(tagIds);
  if (tags.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag) => (
        <li key={tag.id}>
          <TagChip name={tag.name} tone={tag.tone} size={size} />
        </li>
      ))}
    </ul>
  );
}
