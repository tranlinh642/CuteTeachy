import type { IconName } from '@/lib/theme';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface SectionHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: IconName;
  /** Class màu cho icon (vd. `text-secondary`). */
  readonly iconClassName?: string;
  readonly as?: 'h1' | 'h2' | 'h3';
  /** id tiêu đề – dùng cho `aria-labelledby` của section. */
  readonly id?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

/** Tiêu đề khu vực + phụ đề + hành động bên phải. */
export function SectionHeader({
  title,
  subtitle,
  icon,
  iconClassName = 'text-primary',
  as: Heading = 'h2',
  id,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <Heading id={id} className="text-title-lg text-on-surface flex items-center gap-2">
          {icon && <Icon name={icon} filled className={iconClassName} />}
          {title}
        </Heading>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
