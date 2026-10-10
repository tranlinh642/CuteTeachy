'use client';

import { formatMonthName } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import { cn } from '@/lib/cn';

export interface MonthPickerPanelProps {
  /** Tháng đang chọn (0–11). */
  readonly value: number;
  readonly onSelect: (monthIndex: number) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index);

/** Lưới 12 tháng (tên tháng theo `Intl`). */
export function MonthPickerPanel({ value, onSelect }: MonthPickerPanelProps) {
  const { t, localeTag } = useTranslation();
  return (
    <div role="group" aria-label={t('pickers.month.title')} className="grid grid-cols-3 gap-2">
      {MONTHS.map((month) => {
        const selected = month === value;
        return (
          <button
            key={month}
            type="button"
            aria-pressed={selected}
            data-autofocus={selected ? true : undefined}
            onClick={() => onSelect(month)}
            className={cn(
              'text-body-lg min-h-12 rounded-full px-2 font-bold capitalize transition-colors',
              selected ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container',
            )}
          >
            {formatMonthName(month, localeTag, 'short')}
          </button>
        );
      })}
    </div>
  );
}
