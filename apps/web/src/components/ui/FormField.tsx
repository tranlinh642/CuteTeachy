import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps {
  /** id của control bên trong (để gắn `<label htmlFor>`). */
  readonly controlId: string;
  readonly label: string;
  readonly hideLabel?: boolean;
  readonly error?: string;
  readonly hint?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** id mô tả lỗi/gợi ý theo quy ước, để control gắn `aria-describedby`. */
export const fieldDescriptionId = (controlId: string, kind: 'error' | 'hint'): string => `${controlId}-${kind}`;

/** Khung nhãn + thông báo lỗi dùng chung cho TextField, TextArea, DateField… */
export function FormField({ controlId, label, hideLabel, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={controlId}
        className={cn('text-label-md text-on-surface-variant tracking-wider uppercase', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={fieldDescriptionId(controlId, 'error')} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={fieldDescriptionId(controlId, 'hint')} className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
