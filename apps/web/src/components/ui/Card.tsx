import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'elevated' | 'filled' | 'outlined' | 'tonal';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'div' | 'article' | 'section' | 'li' | 'aside';
  readonly variant?: CardVariant;
  readonly padding?: CardPadding;
  /** Hiệu ứng nổi nhẹ khi hover (thẻ bấm được). */
  readonly interactive?: boolean;
  readonly children: ReactNode;
}

const VARIANT_CLASS: Readonly<Record<CardVariant, string>> = {
  elevated: 'bg-surface-container-lowest shadow-sm',
  filled: 'bg-surface-container-low',
  outlined: 'bg-surface-container-lowest border border-outline-variant',
  tonal: 'bg-surface-container-low border border-surface-variant',
};

const PADDING_CLASS: Readonly<Record<CardPadding, string>> = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

/** Bề mặt bo góc lớn (24px) với bóng đổ dịu. */
export function Card({
  as: Component = 'div',
  variant = 'elevated',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-xl',
        VARIANT_CLASS[variant],
        PADDING_CLASS[padding],
        interactive && 'transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
