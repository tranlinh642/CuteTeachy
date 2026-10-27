import type { CreateTimetableSlotInput, TimetableSlot, UpdateTimetableSlotInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { checkSlotConflict, isValidISODate, isValidTime } from '@/utils';
import {
  badRequest,
  conflict,
  created,
  noContent,
  notFound,
  ok,
  route,
} from '../mock-router';
import { createMockSyncEnvelope, validateUpdatedSince } from '../mock-sync';
import { nextId, nowISO } from './handler.utils';

const TIMETABLE_SLOT_BY_ID = ENDPOINTS.timetableSlots.byId(':id');

export const timetableSlotRoutes = [
  route('GET', ENDPOINTS.timetableSlots.root, (request, db) => {
    const { updatedSince } = request.query;
    const now = new Date();
    const updatedSinceVal = validateUpdatedSince(updatedSince, now);
    if (!updatedSinceVal.valid) {
      return updatedSinceVal.response;
    }

    const items = db.timetableSlots.filter((slot) => {
      return !updatedSince || slot.updatedAt > updatedSince;
    });

    const deletedIds = updatedSince
      ? (db.tombstones?.timetableSlots ?? [])
          .filter((t) => t.deletedAt > updatedSince)
          .map((t) => t.id)
      : [];

    return ok(createMockSyncEnvelope(items, deletedIds, now.toISOString()));
  }),

  route('POST', ENDPOINTS.timetableSlots.root, (request, db) => {
    const body = request.body as CreateTimetableSlotInput | null | undefined;
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    const {
      id,
      weekday,
      startTime,
      endTime,
      subject,
      grade,
      room,
      tone,
      effectiveFrom,
      effectiveTo,
    } = body;

    if (!weekday || weekday < 1 || weekday > 7) {
      return badRequest('weekday must be between 1 and 7', 'validation');
    }

    if (!startTime || !isValidTime(startTime) || !endTime || !isValidTime(endTime)) {
      return badRequest('startTime and endTime must be valid HH:mm', 'validation');
    }

    if (startTime >= endTime) {
      return badRequest('startTime must be before endTime', 'validation');
    }

    if (!subject || subject.trim().length === 0 || subject.length > 120) {
      return badRequest('subject must be between 1 and 120 characters', 'validation');
    }

    if (!effectiveFrom || !isValidISODate(effectiveFrom)) {
      return badRequest('effectiveFrom must be a valid YYYY-MM-DD date', 'validation');
    }

    if (effectiveTo && (!isValidISODate(effectiveTo) || effectiveTo < effectiveFrom)) {
      return badRequest('effectiveTo must be >= effectiveFrom', 'validation');
    }

    const isConflict = checkSlotConflict(
      {
        weekday,
        startTime,
        endTime,
        effectiveFrom,
        effectiveTo,
      },
      db.timetableSlots,
    );

    if (isConflict) {
      return conflict('timetable_conflict', 'Timetable slot conflicts with existing slot');
    }

    // Idempotent: check if id already exists
    if (id) {
      const existing = db.timetableSlots.find((s) => s.id === id);
      if (existing) {
        return ok(existing);
      }
    }

    const newSlot: TimetableSlot = {
      id: id ?? nextId('slot'),
      weekday,
      startTime,
      endTime,
      subject: subject.trim(),
      grade: grade?.trim() || undefined,
      room: room?.trim() || null,
      tone: tone ?? 'blue',
      effectiveFrom,
      effectiveTo: effectiveTo ?? null,
      updatedAt: nowISO(),
    };

    db.timetableSlots.push(newSlot);
    return created(newSlot);
  }),

  route('PATCH', TIMETABLE_SLOT_BY_ID, (request, db) => {
    const { id } = request.params;
    const body = request.body as UpdateTimetableSlotInput | null | undefined;
    if (!id) return badRequest('Missing id parameter', 'validation');
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    const index = db.timetableSlots.findIndex((s) => s.id === id);
    if (index === -1) {
      return notFound('timetable_slot_not_found', 'Timetable slot not found');
    }

    const currentSlot = db.timetableSlots[index]!;
    const updatedCandidate = {
      weekday: body.weekday ?? currentSlot.weekday,
      startTime: body.startTime ?? currentSlot.startTime,
      endTime: body.endTime ?? currentSlot.endTime,
      effectiveFrom: body.effectiveFrom ?? currentSlot.effectiveFrom,
      effectiveTo: body.effectiveTo !== undefined ? body.effectiveTo : currentSlot.effectiveTo,
    };

    const isConflict = checkSlotConflict(updatedCandidate, db.timetableSlots, id);
    if (isConflict) {
      return conflict('timetable_conflict', 'Timetable slot conflicts with existing slot');
    }

    const updatedSlot: TimetableSlot = {
      ...currentSlot,
      ...body,
      grade: body.grade !== undefined ? (body.grade?.trim() || undefined) : currentSlot.grade,
      room: body.room !== undefined ? (body.room?.trim() || null) : currentSlot.room,
      updatedAt: nowISO(),
    };

    db.timetableSlots[index] = updatedSlot;
    return ok({ current: updatedSlot });
  }),

  route('DELETE', TIMETABLE_SLOT_BY_ID, (request, db) => {
    const { id } = request.params;
    if (!id) return badRequest('Missing id parameter', 'validation');

    const index = db.timetableSlots.findIndex((s) => s.id === id);
    if (index === -1) {
      return notFound('timetable_slot_not_found', 'Timetable slot not found');
    }

    db.timetableSlots.splice(index, 1);
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [], timetableSlots: [], classSessions: [] };
    }
    if (!db.tombstones.timetableSlots) {
      db.tombstones.timetableSlots = [];
    }
    db.tombstones.timetableSlots.push({ id, deletedAt: nowISO() });

    return noContent();
  }),
];
