import type { ISODate } from '@cute-teachy/types';

/** Filters items whose `date` falls inside an optional `?from=&to=` range. */
export const inDateRange = <T extends { date: ISODate }>(
  items: readonly T[],
  query: Readonly<Record<string, string>>,
): T[] => {
  const { from, to } = query;
  return items.filter((item) => (!from || item.date >= from) && (!to || item.date <= to));
};

export const nowISO = (): string => new Date().toISOString();

export const nextId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
