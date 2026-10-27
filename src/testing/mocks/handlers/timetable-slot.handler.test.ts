import { beforeEach, describe, expect, it } from 'vitest';
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

  describe('DELETE /timetable-slots/:id', () => {
    it('deletes slot and records tombstone', () => {
      const slotId = db.timetableSlots[0]!.id;
      const res = callRoute('DELETE', `/timetable-slots/${slotId}`);
      expect(res.status).toBe(204);

      expect(db.timetableSlots.some((s) => s.id === slotId)).toBe(false);
      expect(db.tombstones?.timetableSlots?.some((t) => t.id === slotId)).toBe(true);
    });
  });
});
