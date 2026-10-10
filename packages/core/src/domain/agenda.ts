import type { AgendaEntry, ClassSession, ISODate, Task } from '@cute-teachy/types';
import { timeToMinutes } from '../date/date-parse';

const entryMinutes = (entry: AgendaEntry): number =>
  entry.time ? timeToMinutes(entry.time) : Number.POSITIVE_INFINITY;

/** Merges classes and tasks of a day into one time-ordered agenda. */
export const buildAgenda = (
  classes: readonly ClassSession[],
  tasks: readonly Task[],
  date: ISODate,
): AgendaEntry[] => {
  const entries: AgendaEntry[] = [
    ...classes
      .filter((session) => session.date === date)
      .map((session): AgendaEntry => ({
        kind: 'class',
        id: session.id,
        date,
        time: session.startTime,
        item: session,
      })),
    ...tasks
      .filter((task) => task.date === date)
      .map((task): AgendaEntry => ({ kind: 'task', id: task.id, date, time: task.time, item: task })),
  ];
  return entries.sort((a, b) => entryMinutes(a) - entryMinutes(b));
};

/** Number of events per day – drives the dots under calendar dates. */
export const countEventsByDate = (
  classes: readonly ClassSession[],
  tasks: readonly Task[],
): ReadonlyMap<ISODate, number> => {
  const counts = new Map<ISODate, number>();
  const bump = (date: ISODate) => counts.set(date, (counts.get(date) ?? 0) + 1);
  classes.forEach((session) => bump(session.date));
  tasks.forEach((task) => bump(task.date));
  return counts;
};
