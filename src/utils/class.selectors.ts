import type { ClassSession, ISODate } from '@/types';
import { timeToMinutes } from './date-parse';

export const sortClasses = (classes: readonly ClassSession[]): ClassSession[] =>
  [...classes].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

export const classesOnDate = (classes: readonly ClassSession[], date: ISODate): ClassSession[] =>
  sortClasses(classes.filter((session) => session.date === date));

export const needsPreparation = (session: ClassSession): boolean =>
  session.prepItems.some((item) => !item.done);
