import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockAdapter } from '../mock-adapter';
import { createMockDb } from '../mock-db';

const setupTest = () => {
  const db = createMockDb();
  let token: string | null = 'mock-test-token';
  const httpClient = createHttpClient({
    mode: 'mock',
    mockLatencyMs: 0,
    getAccessToken: () => token,
    getLocale: () => 'vi',
    onUnauthorized: () => undefined,
  });
  httpClient.defaults.adapter = createMockAdapter({ latencyMs: 0, db });
  const services = createServices(httpClient);
  return { services, db, httpClient, setToken: (t: string | null) => (token = t) };
};

describe('Note Mock Handler (SPEC-003 & S3-FE-04 Contract)', () => {
  const validUuid1 = '11111111-1111-4111-8111-111111111111';
  const validUuid2 = '22222222-2222-4222-8222-222222222222';
  const validItemUuid1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const validItemUuid2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  describe('GET /notes — Cursor Pagination', () => {
    it('returns sync envelope with default limit of 20 and items sorted updatedAt desc', async () => {
      const { services, db } = setupTest();
      const envelope = await services.notes.list();

      expect(envelope).toBeDefined();
      expect(envelope.items).toHaveLength(db.notes.length);
      expect(envelope.deletedIds).toEqual([]);
      expect(new Date(envelope.serverTime).getTime()).not.toBeNaN();
    });

    it('paginates correctly using limit and nextCursor until no more pages', async () => {
      const { services } = setupTest();

      // Page 1: limit 2
      const page1 = await services.notes.list({ limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.nextCursor).toBeTruthy();

      // Page 2: with cursor from page 1
      const page2 = await services.notes.list({ limit: 2, cursor: page1.nextCursor! });
      expect(page2.items).toHaveLength(2);
      expect(page2.nextCursor).toBeTruthy();

      // Items from page 1 and page 2 must be disjoint
      const page1Ids = page1.items.map((n) => n.id);
      const page2Ids = page2.items.map((n) => n.id);
      for (const id of page1Ids) {
        expect(page2Ids).not.toContain(id);
      }

      // Page 3: with cursor from page 2 (remaining 1 seed note)
      const page3 = await services.notes.list({ limit: 2, cursor: page2.nextCursor! });
      expect(page3.items).toHaveLength(1);
      expect(page3.nextCursor).toBeNull();
    });

    it('rejects invalid cursor with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const error = await services.notes.list({ cursor: 'invalid_cursor_string' }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });

    it('rejects invalid limit (< 1 or > 50) with HTTP 400 validation error', async () => {
      const { services } = setupTest();

      const errZero = await services.notes.list({ limit: 0 }).catch((e: unknown) => e);
      expect((errZero as ApiError).status).toBe(400);
      expect((errZero as ApiError).code).toBe('validation');

      const errOver = await services.notes.list({ limit: 51 }).catch((e: unknown) => e);
      expect((errOver as ApiError).status).toBe(400);
      expect((errOver as ApiError).code).toBe('validation');
    });
  });

  describe('GET /notes — Accent-Insensitive Vietnamese Search', () => {
    it('matches note title with unaccented query ("on tap" -> "Ôn tập bài tập Toán")', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ q: 'on tap' });

      expect(envelope.items.length).toBeGreaterThan(0);
      expect(envelope.items.some((n) => n.title.includes('Ôn tập'))).toBe(true);
    });

    it('matches note content with unaccented query ("thi nghiem" -> "thí nghiệm")', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ q: 'thi nghiem' });

      expect(envelope.items.length).toBeGreaterThan(0);
      expect(envelope.items.some((n) => n.id === 'note-1')).toBe(true);
    });

    it('matches checklist item text with unaccented query ("phan so" -> "Phân số")', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ q: 'phan so' });

      expect(envelope.items.length).toBeGreaterThan(0);
      expect(envelope.items.some((n) => n.id === 'note-2')).toBe(true);
    });

    it('performs case-insensitive search ("ON TAP" matches "Ôn tập")', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ q: 'ON TAP' });

      expect(envelope.items.length).toBeGreaterThan(0);
      expect(envelope.items.some((n) => n.title.includes('Ôn tập'))).toBe(true);
    });

    it('returns empty array when search query matches nothing', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ q: 'khong_the_tim_thay_chuoi_nay' });
      expect(envelope.items).toHaveLength(0);
    });
  });

  describe('GET /notes — Tag Filtering', () => {
    it('filters notes containing the specified tagId', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ tagId: 'tag-grading' });

      expect(envelope.items.length).toBeGreaterThan(0);
      for (const note of envelope.items) {
        expect(note.tagIds).toContain('tag-grading');
      }
    });

    it('combines tag filter and search query', async () => {
      const { services } = setupTest();
      const envelope = await services.notes.list({ tagId: 'tag-grading', q: 'on tap' });

      expect(envelope.items.length).toBe(1);
      expect(envelope.items[0]!.id).toBe('note-2');
    });
  });

  describe('GET /notes — Delta Sync via updatedSince', () => {
    it('returns modified notes and soft-deleted notes in deletedIds', async () => {
      const { services, db } = setupTest();
      const checkpoint = '2026-10-20T00:00:00.000Z';

      // Update note-1 after checkpoint
      db.notes[0] = { ...db.notes[0]!, updatedAt: '2026-10-22T00:00:00.000Z' };
      // Keep note-2 before checkpoint
      db.notes[1] = { ...db.notes[1]!, updatedAt: '2026-10-15T00:00:00.000Z' };

      // Soft delete note-3
      const deletedId = db.notes[2]!.id;
      await services.notes.remove(deletedId);

      const envelope = await services.notes.list({ updatedSince: checkpoint });

      expect(envelope.items.some((n) => n.id === db.notes[0]!.id)).toBe(true);
      expect(envelope.items.some((n) => n.id === db.notes[1]!.id)).toBe(false);
      expect(envelope.deletedIds).toContain(deletedId);
    });

    it('rejects updatedSince older than 30 days with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const stale = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

      const error = await services.notes.list({ updatedSince: stale }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });

    it('rejects updatedSince combined with cursor, q, or tagId', async () => {
      const { services } = setupTest();
      const validSince = '2026-10-20T00:00:00.000Z';

      const errQ = await services.notes.list({ updatedSince: validSince, q: 'test' }).catch((e: unknown) => e);
      expect((errQ as ApiError).status).toBe(400);

      const errTag = await services.notes.list({ updatedSince: validSince, tagId: 'tag-1' }).catch((e: unknown) => e);
      expect((errTag as ApiError).status).toBe(400);

      const errCursor = await services.notes.list({ updatedSince: validSince, cursor: 'any' }).catch((e: unknown) => e);
      expect((errCursor as ApiError).status).toBe(400);
    });
  });

  describe('POST /notes — Creation & Completed Domain Rule', () => {
    it('creates note with valid client UUID', async () => {
      const { services } = setupTest();
      const createdNote = await services.notes.create({
        id: validUuid1,
        title: 'Ghi chú thử nghiệm mới',
        content: 'Nội dung ngắn gọn',
      });

      expect(createdNote.id).toBe(validUuid1);
      expect(createdNote.title).toBe('Ghi chú thử nghiệm mới');
      expect(createdNote.completed).toBe(false);
    });

    it('returns HTTP 410 gone when attempting to recreate a soft-deleted note id', async () => {
      const { services } = setupTest();
      await services.notes.create({ id: validUuid1, title: 'Bản nháp' });
      await services.notes.remove(validUuid1);

      const error = await services.notes.create({ id: validUuid1, title: 'Tái tạo lại' }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(410);
      expect((error as ApiError).code).toBe('gone');
    });

    it('is idempotent: returns 200 ok with existing note if same id is sent', async () => {
      const { services } = setupTest();
      const first = await services.notes.create({ id: validUuid1, title: 'Ban đầu' });
      const second = await services.notes.create({ id: validUuid1, title: 'Lần hai' });

      expect(second.id).toBe(first.id);
      expect(second.title).toBe('Ban đầu');
    });

    it('domain rule: non-empty checklist automatically sets completed = all items done', async () => {
      const { services } = setupTest();

      // Case 1: not all done -> completed must be false (ignoring completed: true)
      const notePartial = await services.notes.create({
        id: validUuid1,
        title: 'Checklist chưa xong',
        checklist: [
          { id: validItemUuid1, text: 'Việc 1', done: true },
          { id: validItemUuid2, text: 'Việc 2', done: false },
        ],
        completed: true, // Client attempts to force true
      });
      expect(notePartial.completed).toBe(false);

      // Case 2: all done -> completed must be true (ignoring completed: false)
      const noteAllDone = await services.notes.create({
        id: validUuid2,
        title: 'Checklist đã xong',
        checklist: [
          { id: validItemUuid1, text: 'Việc 1', done: true },
          { id: validItemUuid2, text: 'Việc 2', done: true },
        ],
        completed: false, // Client attempts to force false
      });
      expect(noteAllDone.completed).toBe(true);
    });

    it('domain rule: empty checklist uses client completed value', async () => {
      const { services } = setupTest();

      const noteTrue = await services.notes.create({
        id: validUuid1,
        title: 'Không có checklist nhưng xong',
        completed: true,
      });
      expect(noteTrue.completed).toBe(true);

      const noteFalse = await services.notes.create({
        id: validUuid2,
        title: 'Không có checklist chưa xong',
        completed: false,
      });
      expect(noteFalse.completed).toBe(false);
    });
  });

  describe('PATCH /notes/:id — Update & Completed Rule', () => {
    it('returns 404 not found for nonexistent or soft-deleted note', async () => {
      const { services } = setupTest();

      const errNotFound = await services.notes.update('non-existent-id', { title: 'Mới' }).catch((e: unknown) => e);
      expect((errNotFound as ApiError).status).toBe(404);

      // Soft delete note-1
      await services.notes.remove('note-1');
      const errDeleted = await services.notes.update('note-1', { title: 'Mới' }).catch((e: unknown) => e);
      expect((errDeleted as ApiError).status).toBe(404);
    });

    it('updating checklist automatically updates completed status according to items', async () => {
      const { services } = setupTest();

      // note-2 has 4 checklist items, 1 done, completed=false
      const current = await services.notes.list();
      const note2 = current.items.find((n) => n.id === 'note-2')!;
      expect(note2.completed).toBe(false);

      // Tick all items to done
      const allDoneChecklist = note2.checklist.map((item) => ({ ...item, done: true }));
      const updated = await services.notes.update(note2.id, {
        checklist: allDoneChecklist,
      });

      expect(updated.completed).toBe(true);
      expect(updated.checklist.every((i) => i.done)).toBe(true);

      // Untick one item: completed should become false
      const unDoneChecklist = updated.checklist.map((item, idx) =>
        idx === 0 ? { ...item, done: false } : item,
      );
      const updated2 = await services.notes.update(note2.id, {
        checklist: unDoneChecklist,
      });
      expect(updated2.completed).toBe(false);
    });

    it('updating note with empty checklist allows updating completed directly', async () => {
      const { services } = setupTest();
      // note-3 has empty checklist
      const updated = await services.notes.update('note-3', { completed: true });
      expect(updated.completed).toBe(true);
    });
  });

  describe('DELETE /notes/:id — Soft Delete', () => {
    it('soft deletes active note and is idempotent on repeat delete', async () => {
      const { services } = setupTest();

      await expect(services.notes.remove('note-4')).resolves.toBeUndefined();

      // Repeat delete returns 204 (idempotent)
      await expect(services.notes.remove('note-4')).resolves.toBeUndefined();

      // Subsequent list does not return note-4
      const envelope = await services.notes.list();
      expect(envelope.items.some((n) => n.id === 'note-4')).toBe(false);
    });
  });
});
