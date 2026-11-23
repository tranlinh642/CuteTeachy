'use client';

import { formatShortDate, formatWeekdayShort, isToday, toISODate } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ISODate } from '@/types';
import { cn } from '@/utils/cn';

export interface WeekStripProps {
  readonly days: readonly Date[];
  readonly selectedDate: ISODate;
  readonly onSelect: (date: ISODate) => void;
  readonly className?: string;
}

export function WeekStrip({ days, selectedDate, onSelect, className }: WeekStripProps) {
  const { localeTag } = useTranslation();

  return (
    <div className={cn('grid grid-cols-7 gap-1 sm:gap-2', className)}>
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
              'flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl px-1 py-2 sm:p-3 text-center transition-all duration-200 cursor-pointer min-h-14 sm:min-h-16 min-w-0',
              selected
                ? 'bg-primary text-on-primary shadow-sm scale-102'
                : today
                  ? 'border-2 border-primary bg-primary-container/20 text-on-surface hover:bg-primary-container/40'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/40',
            )}
          >
            <span
              className={cn(
                'text-label-xs sm:text-label-md uppercase tracking-normal sm:tracking-wider whitespace-nowrap',
                selected ? 'text-on-primary/90' : 'text-on-surface-variant',
              )}
            >
              {formatWeekdayShort(day, localeTag)}
            </span>
            <span className="text-title-md sm:text-headline-md font-bold leading-none tabular-nums">
              {day.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
