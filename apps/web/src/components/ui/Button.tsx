import type { IconName } from '@cute-teachy/tokens';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  readonly iconPosition?: 'start' | 'end';
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}

const VARIANT_CLASS: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-primary-container text-on-primary-container shadow-sm hover:bg-primary-fixed-dim',
  secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container',
  danger: 'bg-error-container text-on-error-container hover:bg-tone-rose hover:brightness-95',
};

const SIZE_CLASS: Readonly<Record<ButtonSize, string>> = {
  sm: 'min-h-touch px-4 text-body-sm gap-1.5',
  md: 'min-h-12 px-6 text-body-lg gap-2',
  lg: 'min-h-14 px-8 text-body-lg gap-2',
};

const ICON_SIZE: Readonly<Record<ButtonSize, number>> = { sm: 18, md: 20, lg: 22 };

/** Nút chính của design system (bo tròn hoàn toàn, mục tiêu chạm ≥ 44px). */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconNode = loading ? (
    <Spinner size="sm" />
  ) : icon ? (
    <Icon name={icon} size={ICON_SIZE[size]} filled={variant === 'primary'} />
  ) : null;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {iconPosition === 'start' && iconNode}
      <span>{children}</span>
      {iconPosition === 'end' && iconNode}
    </button>
  );
}
