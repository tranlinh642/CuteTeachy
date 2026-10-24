'use client';

import { useId, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface CodeInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly length?: number;
  readonly disabled?: boolean;
  readonly error?: string;
  readonly label?: string;
  readonly autoFocus?: boolean;
}

/**
 * Ô nhập mã số (mặc định 6 số):
 * - Hỗ trợ dán cả chuỗi (tự lọc chỉ lấy số)
 * - Mở bàn phím số trên mobile (inputMode="numeric")
 * - Chia 6 ô hiển thị trực quan
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
  label,
  autoFocus = false,
}: CodeInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanDigits = value.replace(/\D/g, '').slice(0, length);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(raw);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
    }
  };

  const digits = Array.from({ length }, (_, i) => cleanDigits[i] ?? '');

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-body-sm font-medium text-on-surface">
          {label}
        </label>
      )}

      <div
        className="relative flex items-center justify-between gap-2 sm:gap-3"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden but accessible input spanning the entire container */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={length}
          value={cleanDigits}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />

        {/* 6 Digit display boxes */}
        {digits.map((digit, index) => {
          const isCurrent = index === cleanDigits.length && !disabled;
          return (
            <div
              key={index}
              className={cn(
                'flex h-14 flex-1 items-center justify-center rounded-lg border-2 text-center text-title-lg font-semibold transition-all',
                'bg-surface-container-lowest',
                error
                  ? 'border-error text-error'
                  : isCurrent
                    ? 'border-primary ring-2 ring-primary/20'
                    : digit
                      ? 'border-outline text-on-surface'
                      : 'border-outline-variant text-on-surface-variant',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {digit}
            </div>
          );
        })}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
