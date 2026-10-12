import type { IconName } from '@/lib/theme';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconName;
  readonly action?: ReactNode;
  readonly className?: string;
}

/** Trạng thái trống / lỗi nhẹ nhàng. */
export function EmptyState({ title, description, icon = 'spa', action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <span className="bg-surface-container text-primary inline-flex size-14 items-center justify-center rounded-full">
        <Icon name={icon} size={28} filled />
      </span>
      <p className="text-body-lg text-on-surface max-w-sm">{title}</p>
      {description && <p className="text-body-sm text-on-surface-variant max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
