import type { ID, ISODate, ISODateTime, TimeOfDay, Tone } from './common.interface';

/** Preparation checklist item attached to a class ("Print Worksheets"). */
export interface PrepItem {
  readonly id: ID;
  readonly label: string;
  readonly done: boolean;
}

/** A teaching session shown in "Today's Classes" / "Teaching Classes" / Calendar. */
export interface ClassSession {
  readonly id: ID;
  readonly timetableSlotId: ID | null;
  readonly subject: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly date: ISODate;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly topic?: string;
  readonly prepItems: readonly PrepItem[];
  readonly tone: Tone;
  readonly cancelled: boolean;
  readonly updatedAt: ISODateTime;
}

export interface CreateClassSessionInput {
  readonly id?: ID;
  readonly date: ISODate;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly subject: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly tone: Tone;
  readonly topic?: string;
  readonly prepItems?: readonly PrepItem[];
}

export interface UpdateClassSessionInput {
  readonly topic?: string;
  readonly prepItems?: readonly PrepItem[];
  readonly cancelled?: boolean;
  readonly date?: ISODate;
  readonly startTime?: TimeOfDay;
  readonly endTime?: TimeOfDay;
  readonly subject?: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly tone?: Tone;
}
