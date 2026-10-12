'use client';

import { useTranslation } from '@/lib/i18n';
import type { ISODate } from '@/types';
import { Dialog } from '@/components/ui';
import { DatePickerPanel } from './DatePickerPanel';

export interface DatePickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value?: ISODate;
  readonly onSelect: (date: ISODate) => void;
  readonly title?: string;
}

/** Hộp thoại chọn ngày – chọn xong tự đóng. */
export function DatePickerDialog({ open, onClose, value, onSelect, title }: DatePickerDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={title ?? t('pickers.date.title')} size="sm">
      <DatePickerPanel
        value={value}
        onSelect={(date) => {
          onSelect(date);
          onClose();
        }}
      />
    </Dialog>
  );
}
