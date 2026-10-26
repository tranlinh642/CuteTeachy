import { tagSchema } from '@/utils';
import type { Tag, UpdateTagInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  badRequest,
  conflict,
  created,
  gone,
  noContent,
  notFound,
  ok,
  route,
} from '../mock-router';
import {
  createMockSyncEnvelope,
  THIRTY_DAYS_MS,
  validateUpdatedSince,
  type SoftDeletedRecord,
} from '../mock-sync';
import { nextId } from './handler.utils';
import { z } from 'zod';

const createTagSchema = tagSchema.extend({
  id: z.string().optional(),
});

const updateTagSchema = tagSchema.partial();

const purgeExpiredTagTombstones = (tombstones: SoftDeletedRecord[], now = new Date()): SoftDeletedRecord[] => {
  const cutoff = now.getTime() - THIRTY_DAYS_MS;
  return tombstones.filter((t) => new Date(t.deletedAt).getTime() >= cutoff);
};

export const tagRoutes = [
  route('GET', ENDPOINTS.tags.root, (request, db) => {
    const now = new Date();
    const tombstones = db.tombstones?.tags ?? [];
    const activeTombstones = purgeExpiredTagTombstones(tombstones, now);
    if (db.tombstones) {
      db.tombstones.tags = activeTombstones;
    }

    const updatedSince = typeof request.query.updatedSince === 'string' ? request.query.updatedSince : undefined;
    const validation = validateUpdatedSince(updatedSince, now);
    if (!validation.valid) {
      return validation.response;
    }

    const serverTime = now.toISOString();

    if (updatedSince) {
      const items = db.tags.filter((tag) => !tag.updatedAt || tag.updatedAt > updatedSince);
      const deletedIds = activeTombstones
        .filter((t) => t.deletedAt > updatedSince)
        .map((t) => t.id);
      return ok(createMockSyncEnvelope(items, deletedIds, serverTime));
    }

    return ok(createMockSyncEnvelope(db.tags, [], serverTime));
  }),

  route('POST', ENDPOINTS.tags.root, (request, db) => {
    const parsed = createTagSchema.safeParse(request.body);
    if (!parsed.success) return badRequest();

    const now = new Date();
    const tombstones = db.tombstones?.tags ?? [];
    const activeTombstones = purgeExpiredTagTombstones(tombstones, now);
    if (db.tombstones) {
      db.tombstones.tags = activeTombstones;
    }

    const { id, name, tone } = parsed.data;
    const trimmedName = name.trim();

    // 1. Check if ID was soft deleted -> 410 gone
    if (id && activeTombstones.some((t) => t.id === id)) {
      return gone('gone', 'This item has already been deleted');
    }

    // 2. Idempotent check: if same ID exists, return existing
    if (id) {
      const existing = db.tags.find((t) => t.id === id);
      if (existing) {
        return ok(existing);
      }
    }

    // 3. Name conflict check (case-insensitive)
    const normalizedName = trimmedName.toLowerCase();
    const nameTaken = db.tags.some((t) => t.name.trim().toLowerCase() === normalizedName);
    if (nameTaken) {
      return conflict('tag_name_taken', 'Tag name is already taken');
    }

    const timestamp = now.toISOString();
    const newTag: Tag = {
      id: id || nextId('tag'),
      name: trimmedName,
      tone,
      updatedAt: timestamp,
    };

    db.tags.push(newTag);
    return created(newTag);
  }),

  route('PATCH', ENDPOINTS.tags.byId(':id'), (request, db) => {
    const id = request.params.id;
    const now = new Date();
    const tombstones = db.tombstones?.tags ?? [];
    const activeTombstones = purgeExpiredTagTombstones(tombstones, now);
    if (db.tombstones) {
      db.tombstones.tags = activeTombstones;
    }

    if (activeTombstones.some((t) => t.id === id)) {
      return notFound('not_found', 'Tag not found');
    }

    const index = db.tags.findIndex((t) => t.id === id);
    if (index === -1) {
      return notFound('not_found', 'Tag not found');
    }

    const parsed = updateTagSchema.safeParse(request.body as UpdateTagInput);
    if (!parsed.success) return badRequest();

    const current = db.tags[index]!;
    let newName = current.name;

    if (parsed.data.name !== undefined) {
      const trimmed = parsed.data.name.trim();
      const normalized = trimmed.toLowerCase();
      const conflictFound = db.tags.some(
        (t) => t.id !== id && t.name.trim().toLowerCase() === normalized,
      );
      if (conflictFound) {
        return conflict('tag_name_taken', 'Tag name is already taken');
      }
      newName = trimmed;
    }

    const updated: Tag = {
      ...current,
      name: newName,
      tone: parsed.data.tone ?? current.tone,
      updatedAt: now.toISOString(),
    };

    db.tags[index] = updated;
    return ok(updated);
  }),

  route('DELETE', ENDPOINTS.tags.byId(':id'), (request, db) => {
    const id = request.params.id;
    const now = new Date();
    const tombstones = db.tombstones?.tags ?? [];
    const activeTombstones = purgeExpiredTagTombstones(tombstones, now);
    if (db.tombstones) {
      db.tombstones.tags = activeTombstones;
    }

    // Idempotent delete on already soft-deleted record
    if (activeTombstones.some((t) => t.id === id)) {
      return noContent();
    }

    const index = db.tags.findIndex((t) => t.id === id);
    if (index === -1) {
      return notFound('not_found', 'Tag not found');
    }

    const timestamp = now.toISOString();

    // 1. Remove from active tags and add to tombstones
    db.tags.splice(index, 1);
    activeTombstones.push({ id, deletedAt: timestamp });
    if (db.tombstones) {
      db.tombstones.tags = activeTombstones;
    }

    // 2. Unlink from tasks & update their updatedAt
    db.tasks = db.tasks.map((task) => {
      if (task.tagIds && task.tagIds.includes(id)) {
        return {
          ...task,
          tagIds: task.tagIds.filter((tId) => tId !== id),
          updatedAt: timestamp,
        };
      }
      return task;
    });

    // 3. Unlink from notes & update their updatedAt
    db.notes = db.notes.map((note) => {
      if (note.tagIds && note.tagIds.includes(id)) {
        return {
          ...note,
          tagIds: note.tagIds.filter((tId) => tId !== id),
          updatedAt: timestamp,
        };
      }
      return note;
    });

    return noContent();
  }),
];
