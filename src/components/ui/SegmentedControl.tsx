'use client';

import type { IconName } from '@/lib/theme';
import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: IconName;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** Nhãn nhóm cho trình đọc màn hình. */
  readonly label: string;
  /** id của phần tử nhãn hiển thị (thay cho `label`). */
  readonly labelledBy?: string;
  readonly className?: string;
}

/** Nhóm lựa chọn một (radiogroup) – điều hướng bằng phím mũi tên. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const nextIndex = (index + delta + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cn('flex flex-wrap gap-3', className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'text-body-sm sm:text-body-md inline-flex min-h-touch min-w-0 flex-1 basis-[calc(50%-0.375rem)] sm:basis-auto items-center justify-center gap-1.5 rounded-md border px-3 sm:px-5 py-2 text-center leading-snug font-bold transition-colors duration-200',
              selected
                ? 'bg-secondary-container text-on-secondary-container border-transparent'
                : 'border-secondary text-secondary hover:bg-secondary-container/50 bg-transparent',
            )}
          >
            {option.icon && <Icon name={option.icon} size={20} filled={selected} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
