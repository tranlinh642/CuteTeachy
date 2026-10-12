import type { Tone } from '@/lib/theme';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';
import { toneClasses } from './tone-classes';

export interface TagChipProps {
  readonly name: string;
  readonly tone: Tone;
  readonly size?: 'sm' | 'md';
  /** Hiển thị nút xoá (×) khi có. */
  readonly onRemove?: () => void;
  /** Nhãn a11y của nút xoá, bắt buộc khi có `onRemove`. */
  readonly removeLabel?: string;
  readonly className?: string;
}

/** Nhãn thẻ (tag) tô màu pastel theo tone. */
export function TagChip({ name, tone, size = 'sm', onRemove, removeLabel, className }: TagChipProps) {
  const { bg, fg } = toneClasses[tone];
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full font-bold',
        size === 'sm' ? 'px-2.5 py-0.5 text-label-md' : 'px-3 py-1 text-body-sm',
        bg,
        fg,
        className,
      )}
    >
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? name}
          // Hit area 44px nhưng giữ chip gọn bằng margin âm.
          className="-my-3 -mr-3 inline-flex size-touch shrink-0 items-center justify-center rounded-full hover:bg-white/40"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </span>
  );
}
