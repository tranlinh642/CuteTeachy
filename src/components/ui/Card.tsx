import type { HTMLAttributes, ReactNode } from 'react';
import type { Tone } from '@/lib/theme';
import { cn } from '@/utils/cn';

export type CardVariant = 'elevated' | 'filled' | 'outlined' | 'tonal' | 'tonalSubtle';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: 'div' | 'article' | 'section' | 'li' | 'aside';
  readonly variant?: CardVariant;
  readonly padding?: CardPadding;
  /** Chỉ dùng với variant `tonal` hoặc `tonalSubtle`: nền pastel theo tone. */
  readonly tone?: Tone;
  /** Hiệu ứng nổi nhẹ khi hover (thẻ bấm được). */
  readonly interactive?: boolean;
  readonly children: ReactNode;
}

const VARIANT_CLASS: Readonly<Record<CardVariant, string>> = {
  elevated: 'bg-surface-container-lowest shadow-sm',
  filled: 'bg-surface-container-low',
  outlined: 'bg-surface-container-lowest border border-outline-variant',
  tonal: 'bg-surface-container-low border border-surface-variant',
  tonalSubtle: 'bg-primary-container/30 border border-primary-container/40',
};

const TONAL_SUBTLE_TONE_CLASS: Readonly<Record<Tone, string>> = {
  pink: 'bg-primary-container/30 border border-primary-container/40',
  blue: 'bg-secondary-container/30 border border-secondary-container/40',
  mint: 'bg-secondary-container/30 border border-secondary-container/40',
  beige: 'bg-tertiary-container/30 border border-tertiary-container/40',
  lavender: 'bg-primary-container/30 border border-primary-container/40',
  rose: 'bg-error-container/30 border border-error-container/40',
};

const TONAL_TONE_CLASS: Readonly<Record<Tone, string>> = {
  pink: 'bg-primary-container border border-primary-container/50',
  blue: 'bg-secondary-container border border-secondary-container/50',
  mint: 'bg-secondary-container border border-secondary-container/50',
  beige: 'bg-tertiary-container border border-tertiary-container/50',
  lavender: 'bg-primary-container border border-primary-container/50',
  rose: 'bg-error-container border border-error-container/50',
};

const getVariantClass = (variant: CardVariant, tone?: Tone): string => {
  if (variant === 'tonalSubtle') {
    return tone ? TONAL_SUBTLE_TONE_CLASS[tone] : VARIANT_CLASS.tonalSubtle;
  }
  if (variant === 'tonal' && tone) {
    return TONAL_TONE_CLASS[tone];
  }
  return VARIANT_CLASS[variant];
};

const PADDING_CLASS: Readonly<Record<CardPadding, string>> = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

/** Bề mặt bo góc lớn (24px) với bóng đổ dịu. */
export function Card({
  as: Component = 'div',
  variant = 'elevated',
  padding = 'md',
  tone,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-xl',
        getVariantClass(variant, tone),
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
