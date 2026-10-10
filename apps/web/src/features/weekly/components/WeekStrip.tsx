'use client';

import { formatShortDate, formatWeekdayShort, isToday, toISODate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { cn } from '@/lib/cn';

export interface WeekStripProps {
  readonly days: readonly Date[];
  readonly selectedDate: ISODate;
  readonly onSelect: (date: ISODate) => void;
  readonly className?: string;
}

export function WeekStrip({ days, selectedDate, onSelect, className }: WeekStripProps) {
  const { localeTag } = useTranslation();

  return (
    <div className={cn('grid grid-cols-7 gap-2', className)}>
      {days.map((day) => {
        const iso = toISODate(day);
        const selected = iso === selectedDate;
        const today = isToday(day);

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={selected}
            aria-label={formatShortDate(day, localeTag)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl p-3 text-center transition-all duration-200 cursor-pointer min-h-16',
              selected
                ? 'bg-primary text-on-primary shadow-sm scale-102'
                : today
                  ? 'border-2 border-primary bg-primary-container/20 text-on-surface hover:bg-primary-container/40'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/40',
            )}
          >
            <span
              className={cn(
                'text-label-md uppercase tracking-wider',
                selected ? 'text-on-primary/90' : 'text-on-surface-variant',
              )}
            >
              {formatWeekdayShort(day, localeTag)}
            </span>
            <span className="text-headline-md font-bold leading-none">
              {day.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
