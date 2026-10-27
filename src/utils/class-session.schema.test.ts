import { describe, expect, it } from 'vitest';
import { validate } from './validate';
import { adhocSessionSchema, sessionOverrideSchema } from './class-session.schema';

describe('class-session schemas (SPEC-004)', () => {
  describe('adhocSessionSchema', () => {
    const validAdhocInput = {
      subject: 'Toán học',
      grade: 'Lớp 12A1',
      room: 'Phòng 101',
      date: '2026-10-28',
      startTime: '08:00',
      endTime: '09:30',
      tone: 'blue',
      topic: 'Hình học không gian',
      prepItems: [
        { id: '550e8400-e29b-41d4-a716-446655440000', label: 'Mang thước kẻ và compa', done: false },
      ],
    };

    it('accepts valid adhoc session input', () => {
      const res = validate(adhocSessionSchema, validAdhocInput);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.subject).toBe('Toán học');
        expect(res.data.grade).toBe('Lớp 12A1');
        expect(res.data.room).toBe('Phòng 101');
        expect(res.data.date).toBe('2026-10-28');
        expect(res.data.startTime).toBe('08:00');
        expect(res.data.endTime).toBe('09:30');
        expect(res.data.tone).toBe('blue');
        expect(res.data.topic).toBe('Hình học không gian');
        expect(res.data.prepItems).toHaveLength(1);
      }
    });

    it('requires subject between 1 and 120 chars', () => {
      const resEmpty = validate(adhocSessionSchema, { ...validAdhocInput, subject: '   ' });
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.errors.subject?.key).toBe('validation.required');
      }

      const resTooLong = validate(adhocSessionSchema, { ...validAdhocInput, subject: 'A'.repeat(121) });
      expect(resTooLong.success).toBe(false);
      if (!resTooLong.success) {
        expect(resTooLong.errors.subject?.key).toBe('validation.maxLength');
      }
    });

    it('requires valid date format YYYY-MM-DD', () => {
      const res = validate(adhocSessionSchema, { ...validAdhocInput, date: 'invalid-date' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.errors.date?.key).toBe('validation.invalidDate');
      }
    });

    it('requires valid startTime and endTime and startTime < endTime', () => {
      const resTimeFormat = validate(adhocSessionSchema, { ...validAdhocInput, startTime: '25:99' });
      expect(resTimeFormat.success).toBe(false);
      if (!resTimeFormat.success) {
        expect(resTimeFormat.errors.startTime?.key).toBe('validation.invalidTime');
      }

      const resEqualTime = validate(adhocSessionSchema, { ...validAdhocInput, startTime: '09:00', endTime: '09:00' });
      expect(resEqualTime.success).toBe(false);
      if (!resEqualTime.success) {
        expect(resEqualTime.errors.endTime?.key).toBe('classSession.timeInvalid');
      }

      const resInvertedTime = validate(adhocSessionSchema, { ...validAdhocInput, startTime: '10:00', endTime: '09:00' });
      expect(resInvertedTime.success).toBe(false);
      if (!resInvertedTime.success) {
        expect(resInvertedTime.errors.endTime?.key).toBe('classSession.timeInvalid');
      }
    });

    it('allows optional grade, room, topic to be undefined or trimmed empty strings to undefined', () => {
      const res = validate(adhocSessionSchema, {
        ...validAdhocInput,
        grade: '   ',
        room: '',
        topic: undefined,
        prepItems: undefined,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.grade).toBeUndefined();
        expect(res.data.room).toBeUndefined();
        expect(res.data.topic).toBeUndefined();
      }
    });

    it('limits prepItems to max 100 items', () => {
      const tooManyItems = Array.from({ length: 101 }, (_, i) => ({
        id: `id-${i}`,
        label: `Item ${i}`,
        done: false,
      }));

      const res = validate(adhocSessionSchema, {
        ...validAdhocInput,
        prepItems: tooManyItems,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.errors.prepItems?.key).toBe('classSession.prepItemsMax');
      }
    });
  });

  describe('sessionOverrideSchema', () => {
    it('accepts topic, prepItems, cancelled updates', () => {
      const res = validate(sessionOverrideSchema, {
        topic: 'Chủ đề mới',
        cancelled: true,
        prepItems: [
          { id: 'item-1', label: 'Soạn đề kiểm tra', done: true },
        ],
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.topic).toBe('Chủ đề mới');
        expect(res.data.cancelled).toBe(true);
        expect(res.data.prepItems?.[0]?.done).toBe(true);
      }
    });

    it('allows empty topic string to become undefined', () => {
      const res = validate(sessionOverrideSchema, {
        topic: '   ',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.topic).toBeUndefined();
      }
    });
  });
});
