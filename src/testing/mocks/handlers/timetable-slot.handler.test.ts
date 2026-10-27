import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, parseISODate, toISODate } from '@/utils';
import type { PatchTimetableSlotResult, TimetableSlot } from '@/types';
import { createMockDb, type MockDb } from '../mock-db';
import { matchRoute } from '../mock-router';
import { mockRoutes } from './index';

describe('timetable-slot mock routes (SPEC-004)', () => {
  let db: MockDb;

  beforeEach(() => {
    db = createMockDb(new Date('2026-10-26T00:00:00.000Z'));
  });

  const callRoute = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, query: Record<string, string> = {}) => {
    const matched = matchRoute(mockRoutes, method, path);
    if (!matched) throw new Error(`No route matched: ${method} ${path}`);
    return matched.route.handler(
      {
        method,
        params: matched.params,
        query,
        body,
        locale: 'vi',
      },
      db,
    );
  };

  describe('GET /timetable-slots', () => {
    it('returns envelope with all active timetable slots', () => {
      const res = callRoute('GET', '/timetable-slots');
      expect(res.status).toBe(200);
      const data = res.data as { items: Array<{ id: string; weekday: number }>; deletedIds: string[] };
      expect(data.items.length).toBeGreaterThanOrEqual(10);
      expect(data.deletedIds).toEqual([]);
    });

    it('filters by updatedSince', () => {
      const futureDate = '2027-01-01T00:00:00.000Z';
      const res = callRoute('GET', '/timetable-slots', undefined, { updatedSince: futureDate });
      expect(res.status).toBe(200);
      const data = res.data as { items: unknown[] };
      expect(data.items).toEqual([]);
    });
  });

  describe('POST /timetable-slots', () => {
    it('creates new timetable slot', () => {
      const res = callRoute('POST', '/timetable-slots', {
        weekday: 6, // Saturday
        startTime: '08:00',
        endTime: '09:30',
        subject: 'Toán chuyên đề',
        room: 'Phòng 101',
        tone: 'lavender',
        effectiveFrom: '2026-10-01',
      });
      expect(res.status).toBe(201);
      const slot = res.data as { id: string; weekday: number; subject: string };
      expect(slot.weekday).toBe(6);
      expect(slot.subject).toBe('Toán chuyên đề');
    });

    it('rejects conflict on same weekday, overlapping hours and effective range with 409 timetable_conflict', () => {
      // Mon 09:00 - 10:30 already exists (slot-mon-1)
      const res = callRoute('POST', '/timetable-slots', {
        weekday: 1,
        startTime: '09:30', // overlaps 09:00-10:30! (09:30 < 10:30)
        endTime: '11:00',
        subject: 'Trùng lịch',
        tone: 'pink',
        effectiveFrom: '2026-09-01',
      });

      expect(res.status).toBe(409);
      expect((res.data as { code: string }).code).toBe('timetable_conflict');
    });
  });

  describe('PATCH /timetable-slots/:id', () => {
    it('splits slot when effectiveFrom < today (returns previous and current)', () => {
      const today = toISODate(new Date());
      const yesterday = toISODate(addDays(parseISODate(today), -1));

      // slot-mon-1 has effectiveFrom: '2026-01-01' (< today)
      const originalSlot = db.timetableSlots.find((s) => s.id === 'slot-mon-1')!;
      expect(originalSlot.effectiveFrom < today).toBe(true);

      const res = callRoute('PATCH', '/timetable-slots/slot-mon-1', {
        subject: 'Sinh học nâng cao',
        room: 'Phòng 401',
      });

      expect(res.status).toBe(200);
      const data = res.data as PatchTimetableSlotResult;
      expect(data.previous).toBeDefined();
      expect(data.previous?.id).toBe('slot-mon-1');
      expect(data.previous?.effectiveTo).toBe(yesterday);

      expect(data.current).toBeDefined();
      expect(data.current.id).not.toBe('slot-mon-1');
      expect(data.current.subject).toBe('Sinh học nâng cao');
      expect(data.current.room).toBe('Phòng 401');
      expect(data.current.effectiveFrom).toBe(today);

      // Verify DB contains both previous (ending yesterday) and current (starting today)
      expect(db.timetableSlots.find((s) => s.id === 'slot-mon-1')?.effectiveTo).toBe(yesterday);
      expect(db.timetableSlots.find((s) => s.id === data.current.id)).toBeDefined();
    });

    it('updates in-place when effectiveFrom >= today', () => {
      const today = toISODate(new Date());
      const futureDate = toISODate(addDays(parseISODate(today), 10));

      const futureSlot: TimetableSlot = {
        id: 'slot-future-1',
        weekday: 5,
        startTime: '16:00',
        endTime: '17:00',
        subject: 'Tin học',
        tone: 'mint',
        effectiveFrom: futureDate,
        effectiveTo: null,
        updatedAt: '2026-10-01T00:00:00Z',
      };
      db.timetableSlots.push(futureSlot);

      const res = callRoute('PATCH', '/timetable-slots/slot-future-1', {
        subject: 'Tin học ứng dụng',
        room: 'Lab 2',
      });

      expect(res.status).toBe(200);
      const data = res.data as PatchTimetableSlotResult;
      expect(data.previous).toBeUndefined();
      expect(data.current.id).toBe('slot-future-1');
      expect(data.current.subject).toBe('Tin học ứng dụng');
      expect(data.current.room).toBe('Lab 2');
    });

    it('rejects conflict on PATCH with 409 timetable_conflict', () => {
      // slot-mon-2 is Mon 11:00 - 12:30
      // slot-mon-1 is Mon 09:00 - 10:30
      // Trying to patch slot-mon-2 to overlap with slot-mon-1 (e.g. 09:30 - 11:30)
      const res = callRoute('PATCH', '/timetable-slots/slot-mon-2', {
        startTime: '09:30',
        endTime: '11:00',
      });

      expect(res.status).toBe(409);
      expect((res.data as { code: string }).code).toBe('timetable_conflict');
    });
  });

  describe('DELETE /timetable-slots/:id', () => {
    it('stops slot from today (sets effectiveTo = yesterday) when effectiveFrom < today', () => {
      const today = toISODate(new Date());
      const yesterday = toISODate(addDays(parseISODate(today), -1));

      // slot-mon-1 has effectiveFrom: '2026-01-01'
      const res = callRoute('DELETE', '/timetable-slots/slot-mon-1');
      expect(res.status).toBe(204);

      const slot = db.timetableSlots.find((s) => s.id === 'slot-mon-1');
      expect(slot).toBeDefined();
      expect(slot?.effectiveTo).toBe(yesterday);
      expect(db.tombstones?.timetableSlots?.some((t) => t.id === 'slot-mon-1')).toBeFalsy();
    });

    it('hard-deletes and records tombstone when effectiveFrom >= today', () => {
      const today = toISODate(new Date());
      const futureDate = toISODate(addDays(parseISODate(today), 5));

      const futureSlot: TimetableSlot = {
        id: 'slot-future-delete',
        weekday: 4,
        startTime: '13:00',
        endTime: '14:00',
        subject: 'Âm nhạc',
        tone: 'rose',
        effectiveFrom: futureDate,
        effectiveTo: null,
        updatedAt: '2026-10-01T00:00:00Z',
      };
      db.timetableSlots.push(futureSlot);

      const res = callRoute('DELETE', '/timetable-slots/slot-future-delete');
      expect(res.status).toBe(204);

      expect(db.timetableSlots.some((s) => s.id === 'slot-future-delete')).toBe(false);
      expect(db.tombstones?.timetableSlots?.some((t) => t.id === 'slot-future-delete')).toBe(true);
    });
  });
});
