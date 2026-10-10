import { cn } from '@/lib/cn';

export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  if (orientation === 'vertical') {
    return <span role="separator" aria-orientation="vertical" className={cn('bg-surface-variant w-px self-stretch', className)} />;
  }
  return <hr className={cn('border-surface-variant border-t', className)} />;
}
