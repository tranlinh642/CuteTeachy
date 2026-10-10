'use client';

import {
  addDays,
  addMonths,
  formatMonthName,
  formatWeekdayNarrow,
  formatWeekdayShort,
  getMonthGrid,
  getWeekDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseISODate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
} from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon, IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { MonthPickerPanel } from './MonthPickerPanel';
import { formatFullDate } from './picker-format';
import { YearPickerPanel } from './YearPickerPanel';

export interface DatePickerPanelProps {
  readonly value?: ISODate;
  readonly onSelect: (date: ISODate) => void;
}

type PanelMode = 'days' | 'months' | 'years';

const KEY_OFFSETS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/** Lịch tháng chọn ngày: điều hướng bàn phím (mũi tên, Home/End, PageUp/PageDown). */
export function DatePickerPanel({ value, onSelect }: DatePickerPanelProps) {
  const { t, localeTag } = useTranslation();
  const [focused, setFocused] = useState<Date>(() => (value ? parseISODate(value) : startOfDay(new Date())));
  const [view, setView] = useState<Date>(() => startOfMonth(focused));
  const [mode, setMode] = useState<PanelMode>('days');
  const gridRef = useRef<HTMLTableElement>(null);
  const focusPendingRef = useRef(false);
  const selected = value ? parseISODate(value) : null;

  // Sau khi đổi ngày bằng bàn phím, chuyển focus tới ô mới (roving tabindex).
  useEffect(() => {
    if (!focusPendingRef.current) return;
    focusPendingRef.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [focused]);

  const moveFocus = (date: Date) => {
    focusPendingRef.current = true;
    setFocused(date);
    if (!isSameMonth(date, view)) setView(startOfMonth(date));
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(view, delta);
    setView(next);
    setFocused(startOfMonth(next));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const offset = KEY_OFFSETS[event.key];
    let next: Date | null = offset ? addDays(focused, offset) : null;
    if (event.key === 'Home') next = startOfWeek(focused);
    if (event.key === 'End') next = addDays(startOfWeek(focused), 6);
    if (event.key === 'PageUp') next = addMonths(focused, -1);
    if (event.key === 'PageDown') next = addMonths(focused, 1);
    if (!next) return;
    event.preventDefault();
    moveFocus(next);
  };

  if (mode === 'months') {
    return (
      <MonthPickerPanel
        value={view.getMonth()}
        onSelect={(month) => {
          const next = new Date(view.getFullYear(), month, 1);
          setView(next);
          setFocused(next);
          setMode('days');
        }}
      />
    );
  }

  if (mode === 'years') {
    return (
      <YearPickerPanel
        value={view.getFullYear()}
        onSelect={(year) => {
          const next = new Date(year, view.getMonth(), 1);
          setView(next);
          setFocused(next);
          setMode('days');
        }}
      />
    );
  }

  const weeks = getMonthGrid(view.getFullYear(), view.getMonth());
  const weekdays = getWeekDays(view);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton icon="chevronLeft" aria-label={t('calendar.previousMonth')} onClick={() => changeMonth(-1)} />
        <div className="flex items-center gap-1" aria-live="polite">
          <button
            type="button"
            onClick={() => setMode('months')}
            aria-label={t('calendar.selectMonth')}
            className="text-title-md text-on-surface hover:bg-surface-container inline-flex min-h-touch items-center gap-1 rounded-full px-3 capitalize"
          >
            {formatMonthName(view.getMonth(), localeTag)}
            <Icon name="chevronDown" size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMode('years')}
            aria-label={t('calendar.selectYear')}
            className="text-title-md text-on-surface hover:bg-surface-container inline-flex min-h-touch items-center gap-1 rounded-full px-3 tabular-nums"
          >
            {view.getFullYear()}
            <Icon name="chevronDown" size={18} />
          </button>
        </div>
        <IconButton icon="chevronRight" aria-label={t('calendar.nextMonth')} onClick={() => changeMonth(1)} />
      </div>

      <table ref={gridRef} className="w-full table-fixed border-separate border-spacing-0.5">
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th
                key={day.toISOString()}
                scope="col"
                abbr={formatWeekdayShort(day, localeTag)}
                className="text-label-md text-on-surface-variant pb-1 font-bold uppercase"
              >
                {formatWeekdayNarrow(day, localeTag)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day) return <td key={dayIndex} />;
                const isSelected = selected ? isSameDay(day, selected) : false;
                const isFocused = isSameDay(day, focused);
                const today = isToday(day);
                return (
                  <td key={dayIndex} className="text-center">
                    <button
                      type="button"
                      tabIndex={isFocused ? 0 : -1}
                      data-autofocus={isFocused ? true : undefined}
                      aria-pressed={isSelected}
                      aria-current={today ? 'date' : undefined}
                      aria-label={formatFullDate(day, localeTag)}
                      onClick={() => onSelect(toISODate(day))}
                      onFocus={() => setFocused(day)}
                      onKeyDown={handleKeyDown}
                      className={cn(
                        'text-body-lg mx-auto inline-flex size-touch items-center justify-center rounded-full tabular-nums transition-colors',
                        isSelected
                          ? 'bg-primary-container text-on-primary-container font-bold'
                          : 'text-on-surface hover:bg-surface-container',
                        today && !isSelected && 'ring-primary ring-2 ring-inset',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
