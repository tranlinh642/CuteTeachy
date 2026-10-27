import type { ClassSession, ID, ISODate, ISODateTime, PrepItem, TimetableSlot } from '@/types';
import { addDays, parseISODate, timeToMinutes, toISODate } from '@/utils';

export interface SessionOverride {
  readonly timetableSlotId: ID;
  readonly date: ISODate;
  readonly topic?: string;
  readonly prepItems?: readonly PrepItem[];
  readonly cancelled?: boolean;
  readonly updatedAt: ISODateTime;
}

/**
 * Returns weekday index according to SPEC-004:
 * 1 = Monday ... 7 = Sunday.
 */
export const getWeekdayFromISODate = (dateStr: ISODate): number => {
  const date = parseISODate(dateStr);
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

/**
 * Deterministic session ID generated from (timetableSlotId, date).
 * Stable between reads (SPEC-004).
 */
export const generateSessionId = (timetableSlotId: ID, date: ISODate): string =>
  `cs_${timetableSlotId}_${date}`;

/**
 * Checks whether two time ranges overlap (touching boundaries do not overlap).
 */
export const isTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
};

/**
 * Checks whether two effective date ranges overlap.
 */
export const isEffectiveRangeOverlap = (
  fromA: string,
  toA: string | null | undefined,
  fromB: string,
  toB: string | null | undefined,
): boolean => {
  const maxEnd = '9999-12-31';
  const endA = toA ?? maxEnd;
  const endB = toB ?? maxEnd;
  return fromA <= endB && fromB <= endA;
};

/**
 * Validates timetable slot conflict against existing slots according to SPEC-004:
 * Same weekday, overlapping hours, and overlapping effective ranges.
 */
export const checkSlotConflict = (
  candidate: {
    readonly weekday: number;
    readonly startTime: string;
    readonly endTime: string;
    readonly effectiveFrom: string;
    readonly effectiveTo?: string | null;
  },
  existingSlots: readonly TimetableSlot[],
  ignoreSlotId?: ID,
): boolean => {
  return existingSlots.some((slot) => {
    if (ignoreSlotId && slot.id === ignoreSlotId) return false;
    if (slot.weekday !== candidate.weekday) return false;
    if (!isTimeOverlap(candidate.startTime, candidate.endTime, slot.startTime, slot.endTime)) {
      return false;
    }
    if (!isEffectiveRangeOverlap(candidate.effectiveFrom, candidate.effectiveTo, slot.effectiveFrom, slot.effectiveTo)) {
      return false;
    }
    return true;
  });
};

/**
 * Generates class sessions for a given date range [from, to] (inclusive).
 * Applies any overrides for (slotId, date) and includes adhoc sessions in the range.
 */
export const generateClassSessions = (
  slots: readonly TimetableSlot[],
  overrides: readonly SessionOverride[],
  adhocSessions: readonly ClassSession[],
  from: ISODate,
  to: ISODate,
): ClassSession[] => {
  const result: ClassSession[] = [];
  const fromDate = parseISODate(from);
  const toDate = parseISODate(to);

  // Map overrides by key `${timetableSlotId}_${date}` for fast lookup
  const overrideMap = new Map<string, SessionOverride>();
  for (const override of overrides) {
    overrideMap.set(`${override.timetableSlotId}_${override.date}`, override);
  }

  // Iterate day by day from fromDate to toDate
  let current = fromDate;
  while (current.getTime() <= toDate.getTime()) {
    const dateStr = toISODate(current);
    const day = current.getDay();
    const weekday = day === 0 ? 7 : day;

    for (const slot of slots) {
      if (slot.weekday !== weekday) continue;
      if (dateStr < slot.effectiveFrom) continue;
      if (slot.effectiveTo && dateStr > slot.effectiveTo) continue;

      const override = overrideMap.get(`${slot.id}_${dateStr}`);
      const sessionId = generateSessionId(slot.id, dateStr);

      const session: ClassSession = {
        id: sessionId,
        timetableSlotId: slot.id,
        subject: slot.subject,
        grade: slot.grade,
        room: slot.room ?? null,
        date: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        tone: slot.tone,
        topic: override?.topic,
        prepItems: override?.prepItems ?? [],
        cancelled: override?.cancelled ?? false,
        updatedAt: override && override.updatedAt > slot.updatedAt ? override.updatedAt : slot.updatedAt,
      };

      result.push(session);
    }

    current = addDays(current, 1);
  }

  // Append adhoc sessions within the range
  for (const adhoc of adhocSessions) {
    if (adhoc.date >= from && adhoc.date <= to) {
      result.push(adhoc);
    }
  }

  // Sort by date, then by startTime
  return result.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
};
