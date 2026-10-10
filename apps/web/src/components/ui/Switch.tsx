'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly description?: ReactNode;
  readonly hideLabel?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

/** Công tắc bật/tắt (`role="switch"`), nhãn bên trái. */
export function Switch({ checked, onChange, label, description, hideLabel = false, disabled, className }: SwitchProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-desc` : undefined;

  return (
    <div className={cn('flex min-h-touch items-center justify-between gap-4', className)}>
      <div className={cn('min-w-0', hideLabel && 'sr-only')}>
        <span id={labelId} className="text-body-lg text-on-surface block">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-body-sm text-on-surface-variant block">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors duration-200',
          // Mở rộng vùng chạm lên 44px.
          'after:absolute after:-inset-1.5',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-primary bg-primary' : 'border-outline bg-surface-container-highest',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block size-6 rounded-full shadow-sm transition-transform duration-200',
            checked ? 'bg-on-primary translate-x-6' : 'bg-outline translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
