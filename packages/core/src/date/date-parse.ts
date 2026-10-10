import type { ISODate, TimeOfDay } from '@cute-teachy/types';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Local date → "YYYY-MM-DD" (no timezone shift, unlike `toISOString`). */
export const toISODate = (date: Date): ISODate =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "YYYY-MM-DD" → local Date at 00:00. */
export const parseISODate = (value: ISODate): Date => {
  const [y = 0, m = 1, d = 1] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const isValidISODate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISODate(parseISODate(value)) === value;
};

export const isValidTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const toTimeOfDay = (hours: number, minutes: number): TimeOfDay => `${pad(hours)}:${pad(minutes)}`;

export const parseTime = (value: TimeOfDay): { hours: number; minutes: number } => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return { hours, minutes };
};

/** Minutes since midnight – handy for sorting. */
export const timeToMinutes = (value: TimeOfDay): number => {
  const { hours, minutes } = parseTime(value);
  return hours * 60 + minutes;
};
