import { addDays, DAYS_IN_WEEK, daysInMonth, startOfMonth, startOfWeek, WEEK_STARTS_ON } from './date-math';

/** The `count` days of the week containing `date`, starting Monday. */
export const getWeekDays = (date: Date, count: number = DAYS_IN_WEEK): Date[] => {
  const start = startOfWeek(date);
  return Array.from({ length: count }, (_, index) => addDays(start, index));
};

/**
 * Month grid for calendar views: an array of weeks, each with 7 cells.
 * Cells outside the month are `null` (the design leaves them blank).
 */
export const getMonthGrid = (year: number, monthIndex: number): (Date | null)[][] => {
  const first = startOfMonth(new Date(year, monthIndex, 1));
  const leading = (first.getDay() - WEEK_STARTS_ON + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  const total = daysInMonth(year, monthIndex);

  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => new Date(year, monthIndex, index + 1)),
  ];
  while (cells.length % DAYS_IN_WEEK !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_IN_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_IN_WEEK));
  }
  return weeks;
};

/** Years offered by the Year Selection overlay. */
export const getYearRange = (centerYear: number, radius = 6): number[] =>
  Array.from({ length: radius * 2 + 1 }, (_, index) => centerYear - radius + index);
