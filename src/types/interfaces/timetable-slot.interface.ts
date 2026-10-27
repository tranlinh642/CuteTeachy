import type { ID, ISODate, ISODateTime, TimeOfDay, Tone } from './common.interface';

/** A recurring weekly timetable slot (Thứ, giờ, môn, lớp, phòng, màu, hiệu lực). */
export interface TimetableSlot {
  readonly id: ID;
  readonly weekday: number; // 1 = Thứ Hai … 7 = Chủ nhật
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly subject: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly tone: Tone;
  readonly effectiveFrom: ISODate;
  readonly effectiveTo?: ISODate | null;
  readonly updatedAt: ISODateTime;
}

export interface CreateTimetableSlotInput {
  readonly id?: ID;
  readonly weekday: number;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
  readonly subject: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly tone: Tone;
  readonly effectiveFrom: ISODate;
  readonly effectiveTo?: ISODate | null;
}

export interface UpdateTimetableSlotInput {
  readonly weekday?: number;
  readonly startTime?: TimeOfDay;
  readonly endTime?: TimeOfDay;
  readonly subject?: string;
  readonly grade?: string;
  readonly room?: string | null;
  readonly tone?: Tone;
  readonly effectiveFrom?: ISODate;
  readonly effectiveTo?: ISODate | null;
}

export interface PatchTimetableSlotResult {
  readonly previous?: TimetableSlot;
  readonly current: TimetableSlot;
}
