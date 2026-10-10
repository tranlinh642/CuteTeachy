'use client';

import { useId, type ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/cn';
import { fieldDescriptionId, FormField } from './FormField';

export interface TextAreaProps extends ComponentPropsWithRef<'textarea'> {
  readonly label: string;
  readonly hideLabel?: boolean;
  readonly error?: string;
  readonly hint?: string;
  readonly containerClassName?: string;
}

/** Ô nhập nhiều dòng. */
export function TextArea({
  label,
  hideLabel,
  error,
  hint,
  id,
  rows = 4,
  className,
  containerClassName,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? fieldDescriptionId(inputId, 'error')
    : hint
      ? fieldDescriptionId(inputId, 'hint')
      : undefined;

  return (
    <FormField
      controlId={inputId}
      label={label}
      hideLabel={hideLabel}
      error={error}
      hint={hint}
      className={containerClassName}
    >
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'bg-surface-container text-body-lg text-on-surface placeholder:text-outline w-full resize-y rounded-md p-4 outline-none',
          'focus-visible:ring-secondary focus-visible:ring-2 focus-visible:outline-none',
          error && 'ring-error ring-2',
          className,
        )}
        {...rest}
      />
    </FormField>
  );
}
