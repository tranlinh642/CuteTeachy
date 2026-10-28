import type { ID, ISODate, TimeOfDay, Timestamps } from './common.interface';

export const TASK_CATEGORIES = ['school', 'personal'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_PRIORITIES = ['normal', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** A personal or school to-do (Add Task modal, Personal To-Dos list). */
export interface Task extends Timestamps {
  readonly id: ID;
  readonly title: string;
  readonly notes?: string;
  readonly date: ISODate;
  readonly time?: TimeOfDay;
  readonly category: TaskCategory;
  readonly priority: TaskPriority;
  readonly tagIds: readonly ID[];
  readonly completed: boolean;
}

export type CreateTaskInput = Pick<Task, 'title' | 'date' | 'category'> &
  Partial<Pick<Task, 'id' | 'notes' | 'time' | 'priority' | 'tagIds' | 'completed'>>;

export type UpdateTaskInput = Partial<Omit<Task, 'id' | keyof Timestamps>>;
