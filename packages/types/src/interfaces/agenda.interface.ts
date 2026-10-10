import type { ClassSession } from './class-session.interface';
import type { ID, ISODate, TimeOfDay } from './common.interface';
import type { Task } from './task.interface';

/** Unified calendar entry (classes + tasks) used by weekly / monthly views. */
export type AgendaEntry =
  | {
      readonly kind: 'class';
      readonly id: ID;
      readonly date: ISODate;
      readonly time: TimeOfDay;
      readonly item: ClassSession;
    }
  | {
      readonly kind: 'task';
      readonly id: ID;
      readonly date: ISODate;
      readonly time?: TimeOfDay;
      readonly item: Task;
    };
