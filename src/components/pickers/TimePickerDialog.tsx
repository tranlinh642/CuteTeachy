'use client';

import { useTranslation } from '@/lib/i18n';
import type { TimeOfDay } from '@/types';
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { TimePickerPanel } from './TimePickerPanel';

export interface TimePickerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value?: TimeOfDay;
  readonly onConfirm: (time: TimeOfDay) => void;
}

const DEFAULT_TIME: TimeOfDay = '08:00';

/** Hộp thoại chọn giờ có nút Hủy / Xong (theo thiết kế Time Picker Desktop). */
export function TimePickerDialog({ open, onClose, value, onConfirm }: TimePickerDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} title={t('pickers.time.title')} size="sm">
      {/* Bản nháp nằm trong nội dung → reset mỗi lần mở. */}
      <TimePickerDraft
        initial={value ?? DEFAULT_TIME}
        onCancel={onClose}
        onConfirm={(time) => {
          onConfirm(time);
          onClose();
        }}
        cancelLabel={t('common.actions.cancel')}
        confirmLabel={t('pickers.confirm')}
      />
    </Dialog>
  );
}

interface TimePickerDraftProps {
  readonly initial: TimeOfDay;
  readonly onCancel: () => void;
  readonly onConfirm: (time: TimeOfDay) => void;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
}

function TimePickerDraft({ initial, onCancel, onConfirm, cancelLabel, confirmLabel }: TimePickerDraftProps) {
  const [draft, setDraft] = useState(initial);
  return (
    <div className="flex flex-col gap-6">
      <TimePickerPanel value={draft} onChange={setDraft} />
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={() => onConfirm(draft)}>{confirmLabel}</Button>
      </div>
    </div>
  );
}
