import type { ChecklistItem, Note, UpdateNoteInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { isUuid } from '@/lib/sync';
import {
  badRequest,
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
import { nowISO } from './handler.utils';

const NOTE_BY_ID = ENDPOINTS.notes.byId(':id');
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface NoteCursor {
  readonly updatedAt: string;
  readonly id: string;
}

export const encodeCursor = (cursor: NoteCursor): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }
  return btoa(JSON.stringify(cursor))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const decodeCursor = (encoded: string): NoteCursor | null => {
  try {
    let jsonStr: string;
    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(encoded, 'base64url').toString('utf8');
    } else {
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      jsonStr = atob(base64);
    }
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.updatedAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      !parsed.id
    ) {
      return null;
    }
    const d = new Date(parsed.updatedAt);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return { updatedAt: parsed.updatedAt, id: parsed.id };
  } catch {
    return null;
  }
};

export const normalizeVietnamese = (input: string): string => {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
};

const purgeExpiredNoteTombstones = (
  tombstones: SoftDeletedRecord[],
  now = new Date(),
): SoftDeletedRecord[] => {
  const cutoff = now.getTime() - THIRTY_DAYS_MS;
  return tombstones.filter((t) => new Date(t.deletedAt).getTime() >= cutoff);
};

export const noteRoutes = [
  route('GET', ENDPOINTS.notes.root, (request, db) => {
    const now = new Date();
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }
    const activeTombstones = purgeExpiredNoteTombstones(db.tombstones.notes ?? [], now);
    db.tombstones.notes = activeTombstones;

    const { limit: rawLimit, cursor, q, tagId, updatedSince } = request.query;

    if (updatedSince !== undefined && updatedSince !== null && updatedSince.trim() !== '') {
      if (cursor !== undefined || q !== undefined || tagId !== undefined) {
        return badRequest('updatedSince cannot be combined with cursor, q, or tagId', 'validation');
      }

      const validation = validateUpdatedSince(updatedSince, now);
      if (!validation.valid) {
        return validation.response;
      }

      const sinceStr = updatedSince;
      const items = db.notes
        .filter((note) => !note.updatedAt || note.updatedAt >= sinceStr)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

      const deletedIds = activeTombstones
        .filter((t) => t.deletedAt >= sinceStr)
        .map((t) => t.id);

      return ok(createMockSyncEnvelope(items, deletedIds, now.toISOString(), null));
    }

    let limit = 20;
    if (rawLimit !== undefined && rawLimit !== null && rawLimit.trim() !== '') {
      const parsedLimit = Number(rawLimit);
      if (
        Number.isNaN(parsedLimit) ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 50
      ) {
        return badRequest('limit must be an integer between 1 and 50', 'validation');
      }
      limit = parsedLimit;
    }

    let decodedCursor: NoteCursor | null = null;
    if (cursor !== undefined && cursor !== null && cursor.trim() !== '') {
      decodedCursor = decodeCursor(cursor);
      if (!decodedCursor) {
        return badRequest('Invalid cursor', 'validation');
      }
    }

    // Filter active notes
    let filtered = db.notes.filter((note) => {
      if (activeTombstones.some((t) => t.id === note.id)) {
        return false;
      }

      if (tagId && (!note.tagIds || !note.tagIds.includes(tagId))) {
        return false;
      }

      if (q && q.trim() !== '') {
        const needle = normalizeVietnamese(q);
        const searchContent = [
          note.title,
          note.content ?? '',
          ...(note.checklist ?? []).map((item) => item.text),
        ].join(' ');
        const normalizedHaystack = normalizeVietnamese(searchContent);
        if (!normalizedHaystack.includes(needle)) {
          return false;
        }
      }

      return true;
    });

    // Sort descending by updatedAt, then id desc
    filtered.sort((a, b) => {
      const cmp = b.updatedAt.localeCompare(a.updatedAt);
      if (cmp !== 0) return cmp;
      return b.id.localeCompare(a.id);
    });

    // Apply cursor
    if (decodedCursor) {
      filtered = filtered.filter((note) => {
        if (note.updatedAt < decodedCursor!.updatedAt) return true;
        if (note.updatedAt === decodedCursor!.updatedAt && note.id < decodedCursor!.id) return true;
        return false;
      });
    }

    const hasMore = filtered.length > limit;
    const items = hasMore ? filtered.slice(0, limit) : filtered;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;
      nextCursor = encodeCursor({ updatedAt: last.updatedAt, id: last.id });
    }

    return ok(createMockSyncEnvelope(items, [], now.toISOString(), nextCursor));
  }),

  route('POST', ENDPOINTS.notes.root, (request, db) => {
    const body = request.body as Record<string, unknown> | null | undefined;
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    if (typeof body.id !== 'string' || !isUuid(body.id)) {
      return badRequest('id must be a valid UUID', 'validation');
    }
    const id = body.id;

    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }

    if (db.tombstones.notes?.some((t) => t.id === id)) {
      return gone('gone', 'This item has already been deleted');
    }

    const existing = db.notes.find((n) => n.id === id);
    if (existing) {
      return ok(existing);
    }

    if (typeof body.title !== 'string') {
      return badRequest('title must be a string', 'validation');
    }
    const title = body.title.trim();
    if (title.length < 1 || title.length > 120) {
      return badRequest('title must be between 1 and 120 characters', 'validation');
    }

    let content: string | undefined;
    if (body.content !== undefined && body.content !== null && body.content !== '') {
      if (typeof body.content !== 'string') {
        return badRequest('content must be a string', 'validation');
      }
      if (body.content.length > 5000) {
        return badRequest('content cannot exceed 5000 characters', 'validation');
      }
      content = body.content;
    }

    let dueDate: string | undefined;
    if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
      if (typeof body.dueDate !== 'string' || !DATE_REGEX.test(body.dueDate)) {
        return badRequest('dueDate must be in YYYY-MM-DD format', 'validation');
      }
      dueDate = body.dueDate;
    }

    let tagIds: string[] = [];
    if (body.tagIds !== undefined && body.tagIds !== null) {
      if (!Array.isArray(body.tagIds)) {
        return badRequest('tagIds must be an array', 'validation');
      }
      if (body.tagIds.length > 10) {
        return badRequest('tagIds cannot exceed 10 items', 'validation');
      }
      for (const tId of body.tagIds) {
        if (typeof tId !== 'string') {
          return badRequest('each tagId must be a string', 'validation');
        }
        const tagExists = db.tags.some((t) => t.id === tId);
        const tagDeleted = db.tombstones.tags?.some((t) => t.id === tId);
        if (!tagExists || tagDeleted) {
          return badRequest(
            'One or more tags not found, deleted, or belong to another account',
            'validation',
          );
        }
      }
      tagIds = [...body.tagIds];
    }

    let checklist: ChecklistItem[] = [];
    if (body.checklist !== undefined && body.checklist !== null) {
      if (!Array.isArray(body.checklist)) {
        return badRequest('checklist must be an array', 'validation');
      }
      if (body.checklist.length > 100) {
        return badRequest('checklist cannot exceed 100 items', 'validation');
      }
      for (const item of body.checklist) {
        if (!item || typeof item !== 'object') {
          return badRequest('checklist item must be an object', 'validation');
        }
        if (typeof item.id !== 'string' || !isUuid(item.id)) {
          return badRequest('checklist item id must be a valid UUID', 'validation');
        }
        if (
          typeof item.text !== 'string' ||
          item.text.trim().length < 1 ||
          item.text.length > 200
        ) {
          return badRequest('checklist item text must be between 1 and 200 characters', 'validation');
        }
        if (typeof item.done !== 'boolean') {
          return badRequest('checklist item done must be a boolean', 'validation');
        }
      }
      checklist = body.checklist.map((i) => ({
        id: i.id,
        text: i.text.trim(),
        done: i.done,
      }));
    }

    // Domain rule for completed
    let completed: boolean;
    if (checklist.length > 0) {
      completed = checklist.every((i) => i.done);
    } else {
      if (body.completed !== undefined && typeof body.completed !== 'boolean') {
        return badRequest('completed must be a boolean', 'validation');
      }
      completed = body.completed === true;
    }

    const timestamp = nowISO();
    const newNote: Note = {
      id,
      title,
      checklist,
      tagIds,
      completed,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(content !== undefined ? { content } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(typeof body.imageUrl === 'string' ? { imageUrl: body.imageUrl } : {}),
    };

    db.notes.unshift(newNote);
    return created(newNote);
  }),

  route('PATCH', NOTE_BY_ID, (request, db) => {
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }

    if (db.tombstones.notes?.some((t) => t.id === request.params.id)) {
      return notFound('not_found', 'Note not found');
    }

    const index = db.notes.findIndex((note) => note.id === request.params.id);
    if (index === -1) {
      return notFound('not_found', 'Note not found');
    }
    const current = db.notes[index]!;

    const body = request.body as UpdateNoteInput | null | undefined;
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    type Mutable<T> = { -readonly [P in keyof T]: T[P] };
    const updates: Partial<Mutable<Note>> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string') {
        return badRequest('title must be a string', 'validation');
      }
      const title = body.title.trim();
      if (title.length < 1 || title.length > 120) {
        return badRequest('title must be between 1 and 120 characters', 'validation');
      }
      updates.title = title;
    }

    if (body.content !== undefined) {
      if (body.content !== null && body.content !== '') {
        if (typeof body.content !== 'string') {
          return badRequest('content must be a string', 'validation');
        }
        if (body.content.length > 5000) {
          return badRequest('content cannot exceed 5000 characters', 'validation');
        }
        updates.content = body.content;
      } else {
        updates.content = undefined;
      }
    }

    if (body.dueDate !== undefined) {
      if (body.dueDate !== null && body.dueDate !== '') {
        if (typeof body.dueDate !== 'string' || !DATE_REGEX.test(body.dueDate)) {
          return badRequest('dueDate must be in YYYY-MM-DD format', 'validation');
        }
        updates.dueDate = body.dueDate;
      } else {
        updates.dueDate = undefined;
      }
    }

    if (body.tagIds !== undefined) {
      if (!Array.isArray(body.tagIds)) {
        return badRequest('tagIds must be an array', 'validation');
      }
      if (body.tagIds.length > 10) {
        return badRequest('tagIds cannot exceed 10 items', 'validation');
      }
      for (const tId of body.tagIds) {
        if (typeof tId !== 'string') {
          return badRequest('each tagId must be a string', 'validation');
        }
        const tagExists = db.tags.some((t) => t.id === tId);
        const tagDeleted = db.tombstones.tags?.some((t) => t.id === tId);
        if (!tagExists || tagDeleted) {
          return badRequest(
            'One or more tags not found, deleted, or belong to another account',
            'validation',
          );
        }
      }
      updates.tagIds = [...body.tagIds];
    }

    if (body.checklist !== undefined) {
      if (!Array.isArray(body.checklist)) {
        return badRequest('checklist must be an array', 'validation');
      }
      if (body.checklist.length > 100) {
        return badRequest('checklist cannot exceed 100 items', 'validation');
      }
      for (const item of body.checklist) {
        if (!item || typeof item !== 'object') {
          return badRequest('checklist item must be an object', 'validation');
        }
        if (typeof item.id !== 'string') {
          return badRequest('checklist item id must be a string', 'validation');
        }
        if (
          typeof item.text !== 'string' ||
          item.text.trim().length < 1 ||
          item.text.length > 200
        ) {
          return badRequest('checklist item text must be between 1 and 200 characters', 'validation');
        }
        if (typeof item.done !== 'boolean') {
          return badRequest('checklist item done must be a boolean', 'validation');
        }
      }
      updates.checklist = body.checklist.map((i) => ({
        id: i.id,
        text: i.text.trim(),
        done: i.done,
      }));
    }

    // Domain rule for completed
    const effectiveChecklist =
      updates.checklist !== undefined ? updates.checklist : current.checklist;
    if (effectiveChecklist.length > 0) {
      updates.completed = effectiveChecklist.every((i) => i.done);
    } else {
      if (body.completed !== undefined) {
        if (typeof body.completed !== 'boolean') {
          return badRequest('completed must be a boolean', 'validation');
        }
        updates.completed = body.completed;
      }
    }

    const updatedNote: Note = {
      ...current,
      ...updates,
      updatedAt: nowISO(),
    };

    db.notes[index] = updatedNote;
    return ok(updatedNote);
  }),

  route('DELETE', NOTE_BY_ID, (request, db) => {
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }

    if (db.tombstones.notes?.some((t) => t.id === request.params.id)) {
      return noContent();
    }

    const index = db.notes.findIndex((n) => n.id === request.params.id);
    if (index === -1) {
      return notFound('not_found', 'Note not found');
    }

    db.notes.splice(index, 1);
    db.tombstones.notes.push({
      id: request.params.id,
      deletedAt: nowISO(),
    });
    return noContent();
  }),
];
