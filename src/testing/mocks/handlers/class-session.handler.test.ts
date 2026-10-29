import { beforeEach, describe, expect, it } from 'vitest';
import type { ClassSession } from '@/types';
import { createMockDb, type MockDb } from '../mock-db';
import { matchRoute } from '../mock-router';
import { mockRoutes } from './index';

describe('class-session mock routes (SPEC-004 & SPEC-007)', () => {
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

  describe('GET /class-sessions', () => {
    it('requires from and to query parameters in valid YYYY-MM-DD format', () => {
      const res1 = callRoute('GET', '/class-sessions', undefined, {});
      expect(res1.status).toBe(400);

      const res2 = callRoute('GET', '/class-sessions', undefined, { from: 'invalid', to: '2026-10-30' });
      expect(res2.status).toBe(400);
    });

    it('rejects date ranges exceeding 42 days', () => {
      const res = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-01',
        to: '2026-11-20', // 50 days
      });
      expect(res.status).toBe(400);
    });

    it('generates sessions across month boundary with stable IDs and envelope structure', () => {
      const res = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-11-06',
      });
      expect(res.status).toBe(200);
      const data = res.data as { items: Array<{ id: string; date: string; timetableSlotId: string | null }>; deletedIds: string[] };
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.deletedIds).toEqual([]);

      // Second read should return exact same IDs (stable IDs)
      const res2 = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-11-06',
      });
      const data2 = res2.data as { items: Array<{ id: string }> };
      expect(data2.items.map((i) => i.id)).toEqual(data.items.map((i) => i.id));
    });

    it('includes seeded cancelled sessions and ad-hoc sessions', () => {
      const res = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-11-01',
      });
      expect(res.status).toBe(200);
      const data = res.data as { items: Array<{ cancelled: boolean; timetableSlotId: string | null }> };
      const cancelled = data.items.find((s) => s.cancelled);
      expect(cancelled).toBeDefined();

      const adhoc = data.items.find((s) => s.timetableSlotId === null);
      expect(adhoc).toBeDefined();
    });

    it('handles updatedSince delta sync: returns full list if a slot changed', () => {
      const nowIso = new Date('2026-10-27T12:00:00.000Z').toISOString();
      db.timetableSlots[0] = {
        ...db.timetableSlots[0]!,
        updatedAt: nowIso,
      };

      const res = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-11-01',
        updatedSince: '2026-10-27T00:00:00.000Z',
      });

      expect(res.status).toBe(200);
      const data = res.data as { items: unknown[] };
      expect(data.items.length).toBeGreaterThan(5);
    });
  });

  describe('PATCH & DELETE /class-sessions', () => {
    it('updates override topic, prepItems, cancelled, and category for a generated session', () => {
      const getRes = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-10-26',
      });
      const firstSession = (getRes.data as { items: Array<{ id: string }> }).items[0]!;

      const patchRes = callRoute('PATCH', `/class-sessions/${firstSession.id}`, {
        topic: 'Chủ đề mới được cập nhật',
        cancelled: true,
        category: 'extra_teaching',
      });

      expect(patchRes.status).toBe(200);
      const updated = patchRes.data as ClassSession;
      expect(updated.topic).toBe('Chủ đề mới được cập nhật');
      expect(updated.cancelled).toBe(true);
      expect(updated.category).toBe('extra_teaching');

      // Clearing topic sets it to undefined
      const clearRes = callRoute('PATCH', `/class-sessions/${firstSession.id}`, {
        topic: '   ',
      });
      expect(clearRes.status).toBe(200);
      expect((clearRes.data as ClassSession).topic).toBeUndefined();
      expect((clearRes.data as ClassSession).category).toBe('extra_teaching');
    });

    it('rejects DELETE for generated sessions with 400 cannot_delete_generated_session', () => {
      const getRes = callRoute('GET', '/class-sessions', undefined, {
        from: '2026-10-26',
        to: '2026-10-26',
      });
      const generated = (getRes.data as { items: Array<{ id: string; timetableSlotId: string | null }> }).items.find(
        (s) => s.timetableSlotId !== null,
      )!;

      const delRes = callRoute('DELETE', `/class-sessions/${generated.id}`);
      expect(delRes.status).toBe(400);
      expect((delRes.data as { code: string }).code).toBe('cannot_delete_generated_session');
    });

    it('creates, patches, and deletes ad-hoc session with ScheduleCategory', () => {
      // POST with default category
      const postRes = callRoute('POST', '/class-sessions', {
        date: '2026-10-28',
        startTime: '15:30',
        endTime: '17:00',
        subject: 'Dạy bù Tin học',
        tone: 'mint',
      });
      expect(postRes.status).toBe(201);
      const createdSession = postRes.data as ClassSession;
      expect(createdSession.timetableSlotId).toBeNull();
      expect(createdSession.subject).toBe('Dạy bù Tin học');
      expect(createdSession.category).toBe('school_teaching');

      // POST with self_study category
      const studyRes = callRoute('POST', '/class-sessions', {
        date: '2026-10-28',
        startTime: '19:00',
        endTime: '21:00',
        subject: 'Học bồi dưỡng chuyên môn',
        category: 'self_study',
        tone: 'lavender',
      });
      expect(studyRes.status).toBe(201);
      expect((studyRes.data as ClassSession).category).toBe('self_study');

      // PATCH with topic, prepItems, and category
      const patchRes = callRoute('PATCH', `/class-sessions/${createdSession.id}`, {
        subject: 'Dạy bù Tin học - Lập trình Python',
        topic: 'Vòng lặp for và while',
        category: 'extra_teaching',
        prepItems: [{ id: 'p1', label: 'Cài đặt Python 3.12', done: true }],
      });
      expect(patchRes.status).toBe(200);
      const patched = patchRes.data as ClassSession;
      expect(patched.subject).toBe('Dạy bù Tin học - Lập trình Python');
      expect(patched.topic).toBe('Vòng lặp for và while');
      expect(patched.category).toBe('extra_teaching');
      expect(patched.prepItems[0]?.done).toBe(true);

      // DELETE
      const delRes = callRoute('DELETE', `/class-sessions/${createdSession.id}`);
      expect(delRes.status).toBe(204);

      // Verify tombstone
      expect(db.tombstones?.classSessions?.some((t) => t.id === createdSession.id)).toBe(true);
    });
  });
});
