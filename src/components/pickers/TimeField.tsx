'use client';

import { formatTime } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { TimeOfDay } from '@/types';
import { useId, useState } from 'react';
import { fieldDescriptionId, FormField, Icon, IconButton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { TimePickerDialog } from './TimePickerDialog';

export interface TimeFieldProps {
  readonly label: string;
  readonly value?: TimeOfDay;
  readonly onChange: (time: TimeOfDay | undefined) => void;
  readonly error?: string;
  /** Cho phép xoá giờ (trường không bắt buộc). */
  readonly clearable?: boolean;
  readonly className?: string;
}

/** Ô chọn giờ: bấm để mở TimePickerDialog. */
export function TimeField({ label, value, onChange, error, clearable = true, className }: TimeFieldProps) {
  const { t, localeTag } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <FormField controlId={id} label={label} error={error} className={className}>
      <div
        className={cn(
          'bg-surface-container flex min-h-14 w-full items-center rounded-md pr-1',
          error && 'ring-error ring-2',
        )}
      >
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? fieldDescriptionId(id, 'error') : undefined}
          onClick={() => setOpen(true)}
          className="text-body-lg flex min-h-14 flex-1 items-center gap-3 rounded-md px-4 text-left"
        >
          <Icon name="clock" className="text-on-surface-variant" />
          <span className={cn('flex-1 tabular-nums', value ? 'text-on-surface' : 'text-outline')}>
            {value ? formatTime(value, localeTag) : t('pickers.time.placeholder')}
          </span>
        </button>
        {clearable && value && (
          <IconButton icon="close" aria-label={t('pickers.clear')} onClick={() => onChange(undefined)} />
        )}
      </div>
      <TimePickerDialog open={open} onClose={() => setOpen(false)} value={value} onConfirm={onChange} />
    </FormField>
  );
}
