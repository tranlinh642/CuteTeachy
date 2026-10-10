'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { Dialog } from '@/components/ui';
import { YearPickerPanel } from './YearPickerPanel';

export interface YearPickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value: number;
  readonly onSelect: (year: number) => void;
}

export function YearPickerDialog({ open, onClose, value, onSelect }: YearPickerDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={t('pickers.year.title')} size="sm">
      <YearPickerPanel
        value={value}
        onSelect={(year) => {
          onSelect(year);
          onClose();
        }}
      />
    </Dialog>
  );
}
