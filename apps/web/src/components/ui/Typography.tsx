import type { TypographyVariant } from '@cute-teachy/tokens';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TypographyTone = 'default' | 'muted' | 'primary' | 'secondary' | 'error' | 'onPrimary' | 'inherit';

export type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'strong' | 'time';

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  readonly variant?: TypographyVariant;
  readonly tone?: TypographyTone;
  /** Thẻ HTML ngữ nghĩa; mặc định suy ra từ variant. */
  readonly as?: TypographyElement;
  /** Cắt dòng sau N dòng (1–4). */
  readonly lines?: 1 | 2 | 3 | 4;
  readonly children: ReactNode;
}

const VARIANT_CLASS: Readonly<Record<TypographyVariant, string>> = {
  displayLg: 'text-display-lg',
  displayMd: 'text-display-md',
  headlineMd: 'text-headline-md',
  titleLg: 'text-title-lg',
  titleMd: 'text-title-md',
  bodyLg: 'text-body-lg',
  bodySm: 'text-body-sm',
  labelMd: 'text-label-md',
  labelSm: 'text-label-sm',
};

const DEFAULT_ELEMENT: Readonly<Record<TypographyVariant, TypographyElement>> = {
  displayLg: 'h1',
  displayMd: 'h1',
  headlineMd: 'h2',
  titleLg: 'h3',
  titleMd: 'h4',
  bodyLg: 'p',
  bodySm: 'p',
  labelMd: 'span',
  labelSm: 'span',
};

const TONE_CLASS: Readonly<Record<TypographyTone, string>> = {
  default: 'text-on-surface',
  muted: 'text-on-surface-variant',
  primary: 'text-primary',
  secondary: 'text-secondary',
  error: 'text-error',
  onPrimary: 'text-on-primary',
  inherit: '',
};

const LINES_CLASS = { 1: 'line-clamp-1', 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' } as const;

/** Chữ theo thang typography của design system. */
export function Typography({
  variant = 'bodyLg',
  tone = 'default',
  as,
  lines,
  className,
  children,
  ...rest
}: TypographyProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Component
      className={cn(VARIANT_CLASS[variant], TONE_CLASS[tone], lines && LINES_CLASS[lines], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
