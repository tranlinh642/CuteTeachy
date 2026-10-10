import type { IconName } from '@cute-teachy/tokens';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

export interface FabProps {
  readonly label: string;
  readonly icon?: IconName;
  readonly onClick: () => void;
  readonly className?: string;
}

/** Nút hành động nổi (góc phải dưới) với tooltip hiện khi hover/focus. */
export function Fab({ label, icon = 'add', onClick, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'group bg-primary text-on-primary fixed right-6 bottom-6 z-20 inline-flex size-16 items-center justify-center rounded-lg shadow-lg',
        'transition-[translate,box-shadow] duration-200 hover:-translate-y-1 lg:right-8 lg:bottom-8',
        className,
      )}
    >
      <Icon name={icon} size={28} className="transition-transform duration-300 group-hover:rotate-90" />
      <span
        aria-hidden
        className="bg-inverse-surface text-inverse-on-surface text-label-md pointer-events-none absolute right-full mr-4 rounded-sm px-3 py-1.5 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}
