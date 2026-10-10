import type { ISODate, Task } from '@cute-teachy/types';
import { timeToMinutes } from '../date/date-parse';

/** Untimed tasks go last; then by time; then by creation. */
export const compareTasks = (a: Task, b: Task): number => {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const at = a.time ? timeToMinutes(a.time) : Number.POSITIVE_INFINITY;
  const bt = b.time ? timeToMinutes(b.time) : Number.POSITIVE_INFINITY;
  if (at !== bt) return at - bt;
  return a.createdAt.localeCompare(b.createdAt);
};

export const sortTasks = (tasks: readonly Task[]): Task[] => [...tasks].sort(compareTasks);

export const tasksOnDate = (tasks: readonly Task[], date: ISODate): Task[] =>
  sortTasks(tasks.filter((task) => task.date === date));

export const pendingTasks = (tasks: readonly Task[]): Task[] => tasks.filter((task) => !task.completed);

export const countPendingOn = (tasks: readonly Task[], date: ISODate): number =>
  tasks.reduce((total, task) => (task.date === date && !task.completed ? total + 1 : total), 0);
