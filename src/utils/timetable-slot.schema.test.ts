import { describe, expect, it } from 'vitest';
import { timetableSlotSchema } from './timetable-slot.schema';
import { validate } from './validate';

describe('timetableSlotSchema', () => {
  it('validates a valid timetable slot input', () => {
    const input = {
      weekday: 1,
      startTime: '08:00',
      endTime: '09:30',
      subject: 'Toán học',
      grade: '10A1',
      room: 'P302',
      tone: 'blue',
      effectiveFrom: '2026-09-01',
      effectiveTo: '2027-05-31',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe('Toán học');
      expect(result.data.weekday).toBe(1);
      expect(result.data.grade).toBe('10A1');
      expect(result.data.room).toBe('P302');
    }
  });

  it('allows optional grade, room, and effectiveTo', () => {
    const input = {
      weekday: 3,
      startTime: '14:00',
      endTime: '15:30',
      subject: 'Vật lý',
      grade: '',
      room: '',
      tone: 'pink',
      effectiveFrom: '2026-09-01',
      effectiveTo: '',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBeUndefined();
      expect(result.data.room).toBeUndefined();
      expect(result.data.effectiveTo).toBeUndefined();
    }
  });

  it('rejects empty subject', () => {
    const input = {
      weekday: 2,
      startTime: '08:00',
      endTime: '09:30',
      subject: '   ',
      tone: 'mint',
      effectiveFrom: '2026-09-01',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.subject?.key).toBe('validation.required');
    }
  });

  it('rejects startTime >= endTime', () => {
    const input = {
      weekday: 2,
      startTime: '10:00',
      endTime: '09:30',
      subject: 'Hóa học',
      tone: 'lavender',
      effectiveFrom: '2026-09-01',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.endTime?.key).toBe('validation.startTimeBeforeEndTime');
    }
  });

  it('rejects effectiveTo < effectiveFrom', () => {
    const input = {
      weekday: 2,
      startTime: '08:00',
      endTime: '09:30',
      subject: 'Lịch sử',
      tone: 'beige',
      effectiveFrom: '2026-09-01',
      effectiveTo: '2026-08-31',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.effectiveTo?.key).toBe('validation.effectiveToAfterFrom');
    }
  });

  it('rejects invalid weekday (outside 1..7)', () => {
    const input = {
      weekday: 8,
      startTime: '08:00',
      endTime: '09:30',
      subject: 'Địa lý',
      tone: 'rose',
      effectiveFrom: '2026-09-01',
    };

    const result = validate(timetableSlotSchema, input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.weekday?.key).toBe('validation.invalidWeekday');
    }
  });
});
