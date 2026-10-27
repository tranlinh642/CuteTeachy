import { describe, expect, it } from 'vitest';
import type { ClassSession, TimetableSlot } from '@/types';
import {
  checkSlotConflict,
  generateClassSessions,
  generateSessionId,
  getWeekdayFromISODate,
  type SessionOverride,
} from './session-generator';

describe('session-generator domain logic (SPEC-004)', () => {
  const baseSlot: TimetableSlot = {
    id: 'slot-1',
    weekday: 1, // Monday
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Toán học',
    grade: 'Lớp 10A',
    room: 'Phòng 201',
    tone: 'blue',
    effectiveFrom: '2026-10-01',
    effectiveTo: '2026-11-30',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('determines weekday from ISO date (1=Mon ... 7=Sun)', () => {
    // 2026-10-26 is Monday
    expect(getWeekdayFromISODate('2026-10-26')).toBe(1);
    // 2026-10-27 is Tuesday
    expect(getWeekdayFromISODate('2026-10-27')).toBe(2);
    // 2026-11-01 is Sunday
    expect(getWeekdayFromISODate('2026-11-01')).toBe(7);
  });

  it('generates stable session id from slot id and date', () => {
    const id1 = generateSessionId('slot-1', '2026-10-26');
    const id2 = generateSessionId('slot-1', '2026-10-26');
    expect(id1).toBe(id2);
    expect(id1).toBe('cs_slot-1_2026-10-26');
  });

  it('generates sessions across month boundary matching slot weekday and effective range', () => {
    // Range from Mon 2026-10-26 to Sun 2026-11-08 (two weeks: 2 Mondays: 2026-10-26 and 2026-11-02)
    const sessions = generateClassSessions([baseSlot], [], [], '2026-10-26', '2026-11-08');

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.date).toBe('2026-10-26');
    expect(sessions[0]?.id).toBe('cs_slot-1_2026-10-26');
    expect(sessions[0]?.timetableSlotId).toBe('slot-1');
    expect(sessions[0]?.subject).toBe('Toán học');
    expect(sessions[0]?.room).toBe('Phòng 201');
    expect(sessions[0]?.cancelled).toBe(false);
    expect(sessions[0]?.prepItems).toEqual([]);

    expect(sessions[1]?.date).toBe('2026-11-02');
    expect(sessions[1]?.id).toBe('cs_slot-1_2026-11-02');
  });

  it('respects effectiveFrom and effectiveTo boundaries', () => {
    const boundedSlot: TimetableSlot = {
      ...baseSlot,
      effectiveFrom: '2026-11-01',
      effectiveTo: '2026-11-05',
    };

    // Range includes Mondays: 2026-10-26 (before effectiveFrom), 2026-11-02 (within), 2026-11-09 (after effectiveTo)
    const sessions = generateClassSessions([boundedSlot], [], [], '2026-10-26', '2026-11-15');

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.date).toBe('2026-11-02');
  });

  it('applies session overrides for topic, prepItems, and cancelled status', () => {
    const overrides: SessionOverride[] = [
      {
        timetableSlotId: 'slot-1',
        date: '2026-10-26',
        topic: 'Ôn tập chương 1',
        prepItems: [{ id: 'prep-1', label: 'In đề cương', done: true }],
        cancelled: true,
        updatedAt: '2026-10-20T10:00:00.000Z',
      },
    ];

    const sessions = generateClassSessions([baseSlot], overrides, [], '2026-10-26', '2026-10-26');

    expect(sessions).toHaveLength(1);
    const session = sessions[0]!;
    expect(session.cancelled).toBe(true);
    expect(session.topic).toBe('Ôn tập chương 1');
    expect(session.prepItems).toEqual([{ id: 'prep-1', label: 'In đề cương', done: true }]);
    expect(session.updatedAt).toBe('2026-10-20T10:00:00.000Z');
  });

  it('includes ad-hoc sessions alongside generated sessions and sorts chronologically', () => {
    const adhocSession: ClassSession = {
      id: 'adhoc-1',
      timetableSlotId: null,
      subject: 'Dạy bù Vật lý',
      room: null,
      date: '2026-10-26',
      startTime: '07:00',
      endTime: '08:00',
      tone: 'mint',
      prepItems: [],
      cancelled: false,
      updatedAt: '2026-10-25T00:00:00.000Z',
    };

    const sessions = generateClassSessions([baseSlot], [], [adhocSession], '2026-10-26', '2026-10-26');

    expect(sessions).toHaveLength(2);
    // adhocSession starts at 07:00, baseSlot starts at 08:00 -> adhoc should be first
    expect(sessions[0]?.id).toBe('adhoc-1');
    expect(sessions[0]?.timetableSlotId).toBeNull();
    expect(sessions[1]?.id).toBe('cs_slot-1_2026-10-26');
  });

  describe('checkSlotConflict', () => {
    it('detects conflict when weekday, time, and effective range overlap', () => {
      const conflictSlot = {
        weekday: 1,
        startTime: '08:30',
        endTime: '10:00',
        subject: 'Văn học',
        tone: 'rose' as const,
        effectiveFrom: '2026-10-15',
        effectiveTo: '2026-11-15',
      };

      expect(checkSlotConflict(conflictSlot, [baseSlot])).toBe(true);
    });

    it('allows slots touching boundaries (end == start)', () => {
      const touchingSlot = {
        weekday: 1,
        startTime: '09:30',
        endTime: '11:00',
        subject: 'Văn học',
        tone: 'rose' as const,
        effectiveFrom: '2026-10-01',
      };

      expect(checkSlotConflict(touchingSlot, [baseSlot])).toBe(false);
    });

    it('allows slots on different weekdays', () => {
      const diffWeekdaySlot = {
        weekday: 2, // Tuesday
        startTime: '08:00',
        endTime: '09:30',
        subject: 'Văn học',
        tone: 'rose' as const,
        effectiveFrom: '2026-10-01',
      };

      expect(checkSlotConflict(diffWeekdaySlot, [baseSlot])).toBe(false);
    });

    it('allows slots with non-overlapping effective dates', () => {
      const pastSlot = {
        weekday: 1,
        startTime: '08:00',
        endTime: '09:30',
        subject: 'Văn học',
        tone: 'rose' as const,
        effectiveFrom: '2026-08-01',
        effectiveTo: '2026-09-30',
      };

      expect(checkSlotConflict(pastSlot, [baseSlot])).toBe(false);
    });
  });
});
