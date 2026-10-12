'use client';

import { useTranslation } from '@/lib/i18n';
import { Dialog } from '@/components/ui';
import { MonthPickerPanel } from './MonthPickerPanel';

export interface MonthPickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value: number;
  readonly onSelect: (monthIndex: number) => void;
}

export function MonthPickerDialog({ open, onClose, value, onSelect }: MonthPickerDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={t('pickers.month.title')} size="sm">
      <MonthPickerPanel
        value={value}
        onSelect={(month) => {
          onSelect(month);
          onClose();
        }}
      />
    </Dialog>
  );
}
