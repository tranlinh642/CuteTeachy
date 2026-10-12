import type { IconName } from '@/lib/theme';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export type IconButtonVariant = 'ghost' | 'tonal' | 'filled';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label'> {
  readonly icon: IconName;
  /** Bắt buộc: nút chỉ có icon phải có nhãn cho trình đọc màn hình. */
  readonly 'aria-label': string;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
  readonly filled?: boolean;
  /** Hiển thị chấm thông báo. */
  readonly badge?: boolean;
}

const VARIANT_CLASS: Readonly<Record<IconButtonVariant, string>> = {
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high',
  tonal: 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
  filled: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant',
};

// Kích thước nhỏ nhất vẫn đạt 44px (WCAG 2.5.5 / PRD §5).
const SIZE_CLASS: Readonly<Record<IconButtonSize, string>> = { sm: 'size-touch', md: 'size-12', lg: 'size-14' };
const ICON_SIZE: Readonly<Record<IconButtonSize, number>> = { sm: 20, md: 24, lg: 28 };

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'sm',
  filled = false,
  badge = false,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={ICON_SIZE[size]} filled={filled} />
      {badge && <span aria-hidden className="bg-primary absolute top-2.5 right-2.5 size-2 rounded-full" />}
    </button>
  );
}
