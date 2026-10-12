'use client';

import { getYearRange } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import { useState } from 'react';
import { IconButton } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface YearPickerPanelProps {
  readonly value: number;
  readonly onSelect: (year: number) => void;
}

const RADIUS = 7;
const PAGE = RADIUS * 2 + 1;

/** Lưới năm, có nút chuyển sang khoảng năm trước / sau. */
export function YearPickerPanel({ value, onSelect }: YearPickerPanelProps) {
  const { t } = useTranslation();
  const [center, setCenter] = useState(value);
  const years = getYearRange(center, RADIUS);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <IconButton
          icon="chevronLeft"
          variant="tonal"
          aria-label={t('pickers.year.previousRange')}
          onClick={() => setCenter((year) => year - PAGE)}
        />
        <span className="text-title-md text-on-surface" aria-live="polite">
          {years[0]} – {years[years.length - 1]}
        </span>
        <IconButton
          icon="chevronRight"
          variant="tonal"
          aria-label={t('pickers.year.nextRange')}
          onClick={() => setCenter((year) => year + PAGE)}
        />
      </div>
      <div role="group" aria-label={t('pickers.year.title')} className="grid grid-cols-3 gap-2">
        {years.map((year) => {
          const selected = year === value;
          return (
            <button
              key={year}
              type="button"
              aria-pressed={selected}
              data-autofocus={selected ? true : undefined}
              onClick={() => onSelect(year)}
              className={cn(
                'text-body-lg min-h-12 rounded-full font-bold tabular-nums transition-colors',
                selected ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container',
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
