import { cn } from '@/lib/cn';

export interface SpinnerProps {
  /** Nhãn cho trình đọc màn hình; bỏ trống nếu đã có nhãn bên ngoài. */
  readonly label?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const SIZE_CLASS = { sm: 'size-4 border-2', md: 'size-6 border-[3px]', lg: 'size-10 border-4' } as const;

export function Spinner({ label, size = 'md', className }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent',
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}
