import type { Task, TaskCategory, TaskPriority, UpdateTaskInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { isUuid } from '@/lib/sync';
import { badRequest, created, gone, noContent, notFound, ok, route } from '../mock-router';
import { createMockSyncEnvelope, validateUpdatedSince } from '../mock-sync';
import { nowISO } from './handler.utils';

const TASK_BY_ID = ENDPOINTS.tasks.byId(':id');
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MAX_DATE_RANGE_DAYS = 42;

const isValidCalendarDate = (dateStr: string): boolean => {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return false;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() === m - 1 &&
    dateObj.getUTCDate() === d
  );
};

export const taskRoutes = [
  route('GET', ENDPOINTS.tasks.root, (request, db) => {
    const { from, to, updatedSince } = request.query;

    if (!from || !to) {
      return badRequest('from and to are required in YYYY-MM-DD format', 'validation');
    }

    if (!isValidCalendarDate(from)) {
      return badRequest('from is not a valid calendar date', 'validation');
    }

    if (!isValidCalendarDate(to)) {
      return badRequest('to is not a valid calendar date', 'validation');
    }

    const [fromY, fromM, fromD] = from.split('-').map(Number);
    const [toY, toM, toD] = to.split('-').map(Number);
    const fromDate = new Date(Date.UTC(fromY!, fromM! - 1, fromD!));
    const toDate = new Date(Date.UTC(toY!, toM! - 1, toD!));

    if (fromDate.getTime() > toDate.getTime()) {
      return badRequest('from date cannot be after to date', 'validation');
    }

    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > MAX_DATE_RANGE_DAYS) {
      return badRequest(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`, 'validation');
    }

    const now = new Date();
    const updatedSinceVal = validateUpdatedSince(updatedSince, now);
    if (!updatedSinceVal.valid) {
      return updatedSinceVal.response;
    }

    const items = db.tasks.filter((task) => {
      const inRange = task.date >= from && task.date <= to;
      const isUpdated = !updatedSince || (task.updatedAt !== undefined && task.updatedAt > updatedSince);
      return inRange && isUpdated;
    });

    const deletedIds = updatedSince
      ? (db.tombstones?.tasks ?? [])
          .filter((t) => t.deletedAt > updatedSince)
          .map((t) => t.id)
      : [];

    return ok(createMockSyncEnvelope(items, deletedIds, now.toISOString()));
  }),

  route('POST', ENDPOINTS.tasks.root, (request, db) => {
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

    if (db.tombstones.tasks?.some((t) => t.id === id)) {
      return gone('gone', 'This item has already been deleted');
    }

    const existing = db.tasks.find((t) => t.id === id);
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

    if (typeof body.date !== 'string' || !isValidCalendarDate(body.date)) {
      return badRequest('date must be in YYYY-MM-DD format', 'validation');
    }

    let time: string | undefined;
    if (body.time !== undefined && body.time !== null && body.time !== '') {
      if (typeof body.time !== 'string' || !TIME_REGEX.test(body.time)) {
        return badRequest('time must be in HH:mm format', 'validation');
      }
      time = body.time;
    }

    if (body.category !== 'school' && body.category !== 'personal') {
      return badRequest('category must be either school or personal', 'validation');
    }
    const category = body.category as TaskCategory;

    let priority: TaskPriority = 'normal';
    if (body.priority !== undefined && body.priority !== null) {
      if (body.priority !== 'normal' && body.priority !== 'high') {
        return badRequest('priority must be either normal or high', 'validation');
      }
      priority = body.priority as TaskPriority;
    }

    let notes: string | undefined;
    if (body.notes !== undefined && body.notes !== null && body.notes !== '') {
      if (typeof body.notes !== 'string') {
        return badRequest('notes must be a string', 'validation');
      }
      if (body.notes.length > 1000) {
        return badRequest('notes cannot exceed 1000 characters', 'validation');
      }
      notes = body.notes;
    }

    let completed = false;
    if (body.completed !== undefined && body.completed !== null) {
      if (typeof body.completed !== 'boolean') {
        return badRequest('completed must be a boolean', 'validation');
      }
      completed = body.completed;
    }

    let tagIds: string[] = [];
    if (body.tagIds !== undefined && body.tagIds !== null) {
      if (!Array.isArray(body.tagIds)) {
        return badRequest('tagIds must be an array', 'validation');
      }
      if (body.tagIds.length > 10) {
        return badRequest('tagIds cannot exceed 10 items', 'validation');
      }
      for (const tagId of body.tagIds) {
        if (typeof tagId !== 'string') {
          return badRequest('each tagId must be a string', 'validation');
        }
        const tagExists = db.tags.some((t) => t.id === tagId);
        const tagDeleted = db.tombstones.tags?.some((t) => t.id === tagId);
        if (!tagExists || tagDeleted) {
          return badRequest(
            'One or more tags not found, deleted, or belong to another account',
            'validation',
          );
        }
      }
      tagIds = [...body.tagIds];
    }

    const timestamp = nowISO();
    const newTask: Task = {
      id,
      title,
      date: body.date,
      category,
      priority,
      completed,
      tagIds,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(notes !== undefined ? { notes } : {}),
      ...(time !== undefined ? { time } : {}),
    };

    db.tasks.push(newTask);
    return created(newTask);
  }),

  route('PATCH', TASK_BY_ID, (request, db) => {
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }

    if (db.tombstones.tasks?.some((t) => t.id === request.params.id)) {
      return notFound('not_found', 'Task not found');
    }

    const index = db.tasks.findIndex((task) => task.id === request.params.id);
    if (index === -1) {
      return notFound('not_found', 'Task not found');
    }
    const current = db.tasks[index]!;

    const body = request.body as UpdateTaskInput | null | undefined;
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    type Mutable<T> = { -readonly [P in keyof T]: T[P] };
    const updates: Partial<Mutable<Task>> = {};

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

    if (body.date !== undefined) {
      if (typeof body.date !== 'string' || !isValidCalendarDate(body.date)) {
        return badRequest('date must be in YYYY-MM-DD format', 'validation');
      }
      updates.date = body.date;
    }

    if (body.time !== undefined) {
      if (body.time !== null && body.time !== '') {
        if (typeof body.time !== 'string' || !TIME_REGEX.test(body.time)) {
          return badRequest('time must be in HH:mm format', 'validation');
        }
        updates.time = body.time;
      } else {
        updates.time = undefined;
      }
    }

    if (body.category !== undefined) {
      if (body.category !== 'school' && body.category !== 'personal') {
        return badRequest('category must be either school or personal', 'validation');
      }
      updates.category = body.category;
    }

    if (body.priority !== undefined) {
      if (body.priority !== 'normal' && body.priority !== 'high') {
        return badRequest('priority must be either normal or high', 'validation');
      }
      updates.priority = body.priority;
    }

    if (body.notes !== undefined) {
      if (body.notes !== null && body.notes !== '') {
        if (typeof body.notes !== 'string') {
          return badRequest('notes must be a string', 'validation');
        }
        if (body.notes.length > 1000) {
          return badRequest('notes cannot exceed 1000 characters', 'validation');
        }
        updates.notes = body.notes;
      } else {
        updates.notes = undefined;
      }
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') {
        return badRequest('completed must be a boolean', 'validation');
      }
      updates.completed = body.completed;
    }

    if (body.tagIds !== undefined) {
      if (!Array.isArray(body.tagIds)) {
        return badRequest('tagIds must be an array', 'validation');
      }
      if (body.tagIds.length > 10) {
        return badRequest('tagIds cannot exceed 10 items', 'validation');
      }
      for (const tagId of body.tagIds) {
        if (typeof tagId !== 'string') {
          return badRequest('each tagId must be a string', 'validation');
        }
        const tagExists = db.tags.some((t) => t.id === tagId);
        const tagDeleted = db.tombstones.tags?.some((t) => t.id === tagId);
        if (!tagExists || tagDeleted) {
          return badRequest(
            'One or more tags not found, deleted, or belong to another account',
            'validation',
          );
        }
      }
      updates.tagIds = [...body.tagIds];
    }

    const updated: Task = {
      ...current,
      ...updates,
      updatedAt: nowISO(),
    };

    db.tasks[index] = updated;
    return ok(updated);
  }),

  route('DELETE', TASK_BY_ID, (request, db) => {
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [] };
    }

    if (db.tombstones.tasks?.some((t) => t.id === request.params.id)) {
      return noContent();
    }

    const index = db.tasks.findIndex((task) => task.id === request.params.id);
    if (index === -1) {
      return notFound('not_found', 'Task not found');
    }

    db.tasks.splice(index, 1);
    db.tombstones.tasks.push({
      id: request.params.id,
      deletedAt: nowISO(),
    });

    return noContent();
  }),
];
