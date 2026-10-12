'use client';

import type { IconName } from '@/lib/theme';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { fieldDescriptionId, FormField } from './FormField';
import { Icon } from './Icon';

export interface TextFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  readonly label: string;
  readonly hideLabel?: boolean;
  readonly error?: string;
  readonly hint?: string;
  readonly icon?: IconName;
  /** Phần tử cuối ô (vd. nút hiện mật khẩu). */
  readonly trailing?: ReactNode;
  readonly containerClassName?: string;
}

/** Ô nhập một dòng có nhãn, icon và thông báo lỗi gắn `aria-describedby`. */
export function TextField({
  label,
  hideLabel,
  error,
  hint,
  icon,
  trailing,
  id,
  className,
  containerClassName,
  ...rest
}: TextFieldProps) {
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
      <div
        className={cn(
          'bg-surface-container flex min-h-14 items-center gap-3 rounded-md px-4 transition-shadow',
          'focus-within:ring-secondary focus-within:ring-2',
          error && 'ring-error ring-2',
        )}
      >
        {icon && <Icon name={icon} className="text-on-surface-variant" />}
        <input
          id={inputId}
          type={rest.type ?? 'text'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'text-body-lg text-on-surface placeholder:text-outline min-w-0 flex-1 bg-transparent py-3 outline-none',
            className,
          )}
          {...rest}
        />
        {trailing}
      </div>
    </FormField>
  );
}
