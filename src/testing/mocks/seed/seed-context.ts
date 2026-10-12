import { addDays, startOfWeek, toISODate } from '@/utils';
import type { ISODate, ISODateTime } from '@/types';

/** Seeds are relative to "today" so the UI always shows meaningful data. */
export interface SeedContext {
  readonly today: Date;
  /** Date `offset` days from today. */
  readonly day: (offset: number) => ISODate;
  /** Monday-based weekday of the current week (0 = Monday). */
  readonly weekday: (index: number) => ISODate;
  readonly now: ISODateTime;
}

export const createSeedContext = (today: Date = new Date()): SeedContext => {
  const monday = startOfWeek(today);
  return {
    today,
    day: (offset) => toISODate(addDays(today, offset)),
    weekday: (index) => toISODate(addDays(monday, index)),
    now: today.toISOString(),
  };
};
