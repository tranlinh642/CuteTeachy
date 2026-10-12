import type { IconName, Tone } from '@/lib/theme';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';
import { toneClasses } from './tone-classes';

export interface ChipProps {
  readonly label: string;
  /** Tone pastel; mặc định trung tính. */
  readonly tone?: Tone;
  readonly icon?: IconName;
  /** Có `onClick` → chip là nút bật/tắt (`aria-pressed`). */
  readonly selected?: boolean;
  readonly onClick?: () => void;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

/** Chip lọc / nhãn. Dạng nút khi có `onClick`, dạng nhãn tĩnh khi không. */
export function Chip({ label, tone, icon, selected, onClick, size = 'md', className }: ChipProps) {
  const toneClass = tone ? cn(toneClasses[tone].bg, toneClasses[tone].fg) : 'bg-surface-container-high text-on-surface';
  const classes = cn(
    'inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap transition-colors duration-200',
    size === 'sm' ? 'px-2.5 py-0.5 text-label-md' : 'px-4 py-1.5 text-body-sm',
    selected ? 'bg-primary text-on-primary' : toneClass,
    className,
  );
  const content = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {label}
    </>
  );

  if (!onClick) return <span className={classes}>{content}</span>;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        classes,
        // Vùng chạm tối thiểu 44px.
        'min-h-touch',
        !selected && 'hover:brightness-95',
      )}
    >
      {content}
    </button>
  );
}
