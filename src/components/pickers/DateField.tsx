'use client';

import { parseISODate } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ISODate } from '@/types';
import { useId, useState } from 'react';
import { fieldDescriptionId, FormField, Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { DatePickerDialog } from './DatePickerDialog';
import { formatNumericDate } from './picker-format';

export interface DateFieldProps {
  readonly label: string;
  readonly value?: ISODate;
  readonly onChange: (date: ISODate) => void;
  readonly error?: string;
  readonly placeholder?: string;
  readonly className?: string;
}

/** Ô chọn ngày: bấm để mở DatePickerDialog. */
export function DateField({ label, value, onChange, error, placeholder, className }: DateFieldProps) {
  const { t, localeTag } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <FormField controlId={id} label={label} error={error} className={className}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? fieldDescriptionId(id, 'error') : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          'bg-surface-container text-body-lg flex min-h-14 w-full items-center gap-3 rounded-md px-4 text-left',
          error && 'ring-error ring-2',
        )}
      >
        <Icon name="calendar" className="text-on-surface-variant" />
        <span className={cn('flex-1 tabular-nums', value ? 'text-on-surface' : 'text-outline')}>
          {value ? formatNumericDate(parseISODate(value), localeTag) : (placeholder ?? t('pickers.date.placeholder'))}
        </span>
      </button>
      <DatePickerDialog open={open} onClose={() => setOpen(false)} value={value} onSelect={onChange} title={label} />
    </FormField>
  );
}
