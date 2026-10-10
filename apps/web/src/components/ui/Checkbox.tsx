'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

export interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  /** Ẩn nhãn khỏi giao diện (vẫn đọc được bởi trình đọc màn hình). */
  readonly hideLabel?: boolean;
  /** Gạch ngang nhãn khi đã chọn (to-do hoàn thành). */
  readonly strikeWhenChecked?: boolean;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly className?: string;
}

/** Checkbox gốc (input) với giao diện bo tròn; cả hàng là vùng bấm. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  hideLabel = false,
  strikeWhenChecked = false,
  disabled = false,
  id,
  className,
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = description ? `${inputId}-desc` : undefined;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group flex min-h-touch items-start gap-3 rounded-md py-2',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.checked)}
          className={cn(
            'peer size-6 appearance-none rounded-sm border-2 border-outline bg-surface-container-lowest transition-colors',
            'checked:border-secondary checked:bg-secondary',
          )}
        />
        <Icon
          name="check"
          size={18}
          className="text-on-secondary pointer-events-none absolute opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className={cn('min-w-0 flex-1', hideLabel && 'sr-only')}>
        <span
          className={cn(
            'text-body-lg text-on-surface block break-words',
            strikeWhenChecked && checked && 'text-on-surface-variant line-through',
          )}
        >
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-body-sm text-on-surface-variant block">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
