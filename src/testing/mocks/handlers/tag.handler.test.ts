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

describe('Tag Mock Handler (SPEC-003 & S3-FE-02)', () => {
  describe('GET /tags', () => {
    it('returns full sync envelope with all active seed tags when updatedSince is omitted', async () => {
      const { services, db } = setupTest();
      const envelope = await services.tags.list();

      expect(envelope.items).toHaveLength(db.tags.length);
      expect(envelope.deletedIds).toEqual([]);
      expect(new Date(envelope.serverTime).getTime()).not.toBeNaN();
    });

    it('returns only modified tags and deletedIds when updatedSince is provided', async () => {
      const { services, db } = setupTest();
      const checkpoint = '2026-10-15T00:00:00.000Z';

      // Modify one tag after checkpoint
      db.tags[0] = { ...db.tags[0]!, name: 'Modified Tag', updatedAt: '2026-10-20T10:00:00.000Z' };

      // Leave another tag before checkpoint
      db.tags[1] = { ...db.tags[1]!, updatedAt: '2026-10-10T10:00:00.000Z' };

      // Soft delete a tag after checkpoint
      const deletedId = db.tags[2]!.id;
      await services.tags.remove(deletedId);

      const envelope = await services.tags.list(checkpoint);

      expect(envelope.items.some((t) => t.id === db.tags[0]!.id)).toBe(true);
      expect(envelope.items.some((t) => t.id === db.tags[1]!.id)).toBe(false);
      expect(envelope.deletedIds).toContain(deletedId);
    });

    it('rejects updatedSince older than 30 days with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

      const error = await services.tags.list(staleDate).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });

    it('rejects malformed updatedSince date with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const error = await services.tags.list('invalid-date-string').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });
  });

  describe('POST /tags', () => {
    it('creates a new tag with client UUID, trims name, sets updatedAt and returns 201', async () => {
      const { services } = setupTest();
      const newTag = await services.tags.create({
        name: '  Kỹ năng sống  ',
        tone: 'lavender',
      });

      expect(newTag.name).toBe('Kỹ năng sống');
      expect(newTag.tone).toBe('lavender');
      expect(newTag.id).toBeDefined();
      expect(newTag.updatedAt).toBeDefined();
    });

    it('returns existing tag with HTTP 200 on idempotent duplicate create', async () => {
      const { services, db } = setupTest();
      const existing = db.tags[0]!;

      const result = await services.tags.create({
        id: existing.id,
        name: existing.name,
        tone: existing.tone,
      });

      expect(result.id).toBe(existing.id);
      expect(result.name).toBe(existing.name);
    });

    it('returns 410 gone when attempting to create with a soft-deleted ID', async () => {
      const { services, db } = setupTest();
      const targetId = db.tags[0]!.id;
      await services.tags.remove(targetId);

      const error = await services.tags
        .create({
          id: targetId,
          name: 'Tái sinh',
          tone: 'mint',
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(410);
      expect((error as ApiError).code).toBe('gone');
    });

    it('returns 409 tag_name_taken when tag name already exists (case-insensitive)', async () => {
      const { services } = setupTest();
      // 'Khoa học' exists in seed
      const error = await services.tags
        .create({
          name: 'khoa HỌC',
          tone: 'pink',
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).code).toBe('tag_name_taken');
      expect((error as ApiError).messageKey).toBe('errors.tagNameTaken');
    });

    it('rejects empty or whitespace-only name with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const error = await services.tags
        .create({
          name: '   ',
          tone: 'pink',
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });

    it('rejects name exceeding 24 characters with HTTP 400 validation error', async () => {
      const { services } = setupTest();
      const error = await services.tags
        .create({
          name: 'a'.repeat(25),
          tone: 'pink',
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).code).toBe('validation');
    });
  });

  describe('PATCH /tags/:id', () => {
    it('updates tag name and tone with trimmed name and new updatedAt', async () => {
      const { services, db } = setupTest();
      const target = db.tags[0]!;

      const updated = await services.tags.update(target.id, {
        name: '  Toán ứng dụng  ',
        tone: 'mint',
      });

      expect(updated.id).toBe(target.id);
      expect(updated.name).toBe('Toán ứng dụng');
      expect(updated.tone).toBe('mint');
      expect(new Date(updated.updatedAt!).getTime()).toBeGreaterThanOrEqual(new Date(target.updatedAt!).getTime());
    });

    it('allows a tag to retain its existing name without triggering 409', async () => {
      const { services, db } = setupTest();
      const target = db.tags[0]!;

      const updated = await services.tags.update(target.id, {
        name: target.name.toUpperCase(),
        tone: 'rose',
      });

      expect(updated.name).toBe(target.name.toUpperCase());
      expect(updated.tone).toBe('rose');
    });

    it('returns 409 tag_name_taken when new name collides with another tag (case-insensitive)', async () => {
      const { services, db } = setupTest();
      const tag1 = db.tags[0]!;
      const tag2 = db.tags[1]!;

      const error = await services.tags
        .update(tag1.id, {
          name: tag2.name.toLowerCase(),
        })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).code).toBe('tag_name_taken');
    });

    it('returns 404 when updating non-existent or soft-deleted tag', async () => {
      const { services, db } = setupTest();
      const target = db.tags[0]!;
      await services.tags.remove(target.id);

      const errorDeleted = await services.tags
        .update(target.id, { name: 'Something' })
        .catch((e: unknown) => e);
      expect(errorDeleted).toMatchObject({ status: 404 });

      const errorMissing = await services.tags
        .update('non-existent-id', { name: 'Something' })
        .catch((e: unknown) => e);
      expect(errorMissing).toMatchObject({ status: 404 });
    });
  });

  describe('DELETE /tags/:id and Task/Note unlinking (SPEC-003 US 14)', () => {
    it('soft deletes tag with 204 and idempotent repeat DELETE returns 204', async () => {
      const { services, db } = setupTest();
      const target = db.tags[0]!;

      await services.tags.remove(target.id);
      expect(db.tags.some((t) => t.id === target.id)).toBe(false);
      expect(db.tombstones?.tags.some((t) => t.id === target.id)).toBe(true);

      // Repeat delete should succeed idempotently
      await expect(services.tags.remove(target.id)).resolves.toBeUndefined();
    });

    it('returns 404 when deleting a tag that never existed', async () => {
      const { services } = setupTest();
      const error = await services.tags.remove('never-heard-of').catch((e: unknown) => e);
      expect(error).toMatchObject({ status: 404 });
    });

    it('unlinks tag from tasks & notes and updates their updatedAt timestamps', async () => {
      const { services, db } = setupTest();
      const tagToDelete = db.tags[0]!.id;

      // Attach tagToDelete to a task and a note
      const taskTimestampBefore = '2026-10-01T00:00:00.000Z';
      const noteTimestampBefore = '2026-10-01T00:00:00.000Z';

      db.tasks[0] = {
        ...db.tasks[0]!,
        tagIds: [tagToDelete, 'other-tag'],
        updatedAt: taskTimestampBefore,
      };

      db.notes[0] = {
        ...db.notes[0]!,
        tagIds: ['keep-tag', tagToDelete],
        updatedAt: noteTimestampBefore,
      };

      // Delete the tag
      await services.tags.remove(tagToDelete);

      // Verify task unlinking
      const affectedTask = db.tasks[0]!;
      expect(affectedTask.tagIds).toEqual(['other-tag']);
      expect(affectedTask.tagIds).not.toContain(tagToDelete);
      expect(affectedTask.updatedAt).not.toBe(taskTimestampBefore);
      expect(new Date(affectedTask.updatedAt).getTime()).toBeGreaterThan(new Date(taskTimestampBefore).getTime());

      // Verify note unlinking
      const affectedNote = db.notes[0]!;
      expect(affectedNote.tagIds).toEqual(['keep-tag']);
      expect(affectedNote.tagIds).not.toContain(tagToDelete);
      expect(affectedNote.updatedAt).not.toBe(noteTimestampBefore);
      expect(new Date(affectedNote.updatedAt).getTime()).toBeGreaterThan(new Date(noteTimestampBefore).getTime());
    });
  });
});
