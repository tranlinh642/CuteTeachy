import type { ID, ISODate, TimeOfDay, Tone } from './common.interface';

/** Preparation checklist item attached to a class ("Print Worksheets"). */
export interface PrepItem {
  readonly id: ID;
  readonly label: string;
  readonly done: boolean;
}

/** A teaching slot shown in "Today's Classes" / "Teaching Classes". */
export interface ClassSession {
  readonly id: ID;
  readonly subject: string;
  readonly grade?: string;
  readonly room: string;
  readonly date: ISODate;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly topic?: string;
  readonly prepItems: readonly PrepItem[];
  readonly tone: Tone;
}
