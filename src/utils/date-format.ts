import type { TimeOfDay } from '@/types';
import { parseTime } from './date-parse';

/**
 * Locale-aware formatters built on `Intl` – weekday & month names never live
 * in translation files. Pass `localeTag` from `useTranslation()`.
 */

export const formatWeekdayShort = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date);

export const formatWeekdayNarrow = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { weekday: 'narrow' }).format(date);

export const formatMonthYear = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(date);

export const formatMonthName = (monthIndex: number, localeTag: string, width: 'long' | 'short' = 'long'): string =>
  new Intl.DateTimeFormat(localeTag, { month: width }).format(new Date(2000, monthIndex, 1));

/** "Wed, Oct 11" / "Th 4, 11 thg 10". */
export const formatShortDate = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);

/** "October 2 – October 6" style range parts. */
export const formatMonthDay = (date: Date, localeTag: string): string =>
  new Intl.DateTimeFormat(localeTag, { month: 'long', day: 'numeric' }).format(date);

/** "09:00 AM" (en) / "09:00" (vi). */
export const formatTime = (time: TimeOfDay, localeTag: string): string => {
  const { hours, minutes } = parseTime(time);
  return new Intl.DateTimeFormat(localeTag, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(2000, 0, 1, hours, minutes),
  );
};

export const formatTimeRange = (start: TimeOfDay, end: TimeOfDay, localeTag: string): string =>
  `${formatTime(start, localeTag)} – ${formatTime(end, localeTag)}`;
