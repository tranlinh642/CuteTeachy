import { describe, expect, it } from 'vitest';
import { getMonthGrid, getWeekDays } from './calendar-grid';
import { addMonths, startOfWeek } from './date-math';
import { isValidISODate, isValidTime, parseISODate, toISODate } from './date-parse';

describe('date-parse', () => {
  it('round-trips ISO dates without timezone drift', () => {
    expect(toISODate(parseISODate('2026-10-09'))).toBe('2026-10-09');
  });

  it('validates dates and times', () => {
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
  });
});

describe('date-math', () => {
  it('starts weeks on Monday', () => {
    // 2026-10-11 is a Sunday → week starts Monday 2026-10-05
    expect(toISODate(startOfWeek(parseISODate('2026-10-11')))).toBe('2026-10-05');
  });

  it('clamps day when adding months', () => {
    expect(toISODate(addMonths(parseISODate('2026-01-31'), 1))).toBe('2026-02-28');
  });
});

describe('calendar-grid', () => {
  it('returns Mon–Fri for school weeks', () => {
    const days = getWeekDays(parseISODate('2026-10-09'), 5).map(toISODate);
    expect(days).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
  });

  it('pads the month grid to full weeks', () => {
    // October 2023 starts on Sunday → 6 leading blanks (matches the design)
    const grid = getMonthGrid(2023, 9);
    expect(grid[0]?.slice(0, 6).every((cell) => cell === null)).toBe(true);
    expect(grid[0]?.[6]?.getDate()).toBe(1);
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });
});
