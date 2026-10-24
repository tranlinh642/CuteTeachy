'use client';

import { useRef, type KeyboardEvent } from 'react';
import type { Gender } from '@/types';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

export interface GenderOption {
  readonly value: Gender;
  readonly label: string;
}

export interface GenderSelectorProps {
  readonly options: readonly GenderOption[];
  readonly value: Gender | null;
  readonly onChange: (value: Gender) => void;
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
  readonly className?: string;
}

export function GenderSelector({
  options,
  value,
  onChange,
  label,
  error,
  hint,
  className,
}: GenderSelectorProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const nextIndex = (index + delta + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-label-md text-on-surface-variant tracking-wider uppercase">
        {label} <span className="text-error" aria-hidden>*</span>
      </label>
      <div
        role="radiogroup"
        aria-label={label}
        aria-required="true"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          const isFirst = index === 0;
          const tabIndex = selected ? 0 : value === null && isFirst ? 0 : -1;

          return (
            <button
              key={option.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabIndex}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-body-md font-semibold transition-all duration-200 cursor-pointer',
                selected
                  ? 'border-primary bg-primary-container text-on-primary-container shadow-xs ring-2 ring-primary/20'
                  : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface hover:border-outline',
              )}
            >
              <Icon name="person" size={20} filled={selected} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
