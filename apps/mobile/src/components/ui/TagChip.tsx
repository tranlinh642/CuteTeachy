import type { Tag } from '@cute-teachy/types';
import { Chip, type ChipProps } from './Chip';

export interface TagChipProps extends Omit<ChipProps, 'label' | 'tone'> {
  readonly tag: Pick<Tag, 'name' | 'tone'>;
}

/** Chip hiển thị một thẻ (tag) với màu pastel của nó. */
export function TagChip({ tag, ...rest }: TagChipProps) {
  return <Chip label={tag.name} tone={tag.tone} {...rest} />;
}
