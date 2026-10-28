import type { CreateTimetableSlotInput, PatchTimetableSlotResult, TimetableSlot, UpdateTimetableSlotInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { addDays, checkSlotConflict, isValidISODate, isValidTime, parseISODate, toISODate } from '@/utils';
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

    if (body.weekday !== undefined && (body.weekday < 1 || body.weekday > 7)) {
      return badRequest('weekday must be between 1 and 7', 'validation');
    }
    if (body.startTime !== undefined && !isValidTime(body.startTime)) {
      return badRequest('startTime must be valid HH:mm', 'validation');
    }
    if (body.endTime !== undefined && !isValidTime(body.endTime)) {
      return badRequest('endTime must be valid HH:mm', 'validation');
    }

    const newStartTime = body.startTime ?? currentSlot.startTime;
    const newEndTime = body.endTime ?? currentSlot.endTime;
    if (newStartTime >= newEndTime) {
      return badRequest('startTime must be before endTime', 'validation');
    }

    if (body.subject !== undefined && (body.subject.trim().length === 0 || body.subject.length > 120)) {
      return badRequest('subject must be between 1 and 120 characters', 'validation');
    }

    const today = toISODate(new Date());
    const yesterday = toISODate(addDays(parseISODate(today), -1));

    // Sửa slot SPEC-004:
    // Slot có effectiveFrom < hôm nay -> TÁCH:
    // Slot cũ effectiveTo = hôm qua.
    // Slot mới (id do BE sinh) mang giá trị mới, effectiveFrom = hôm nay, effectiveTo giữ nguyên trừ khi sửa.
    if (currentSlot.effectiveFrom < today) {
      const candidate = {
        weekday: body.weekday ?? currentSlot.weekday,
        startTime: newStartTime,
        endTime: newEndTime,
        effectiveFrom: today,
        effectiveTo: body.effectiveTo !== undefined ? body.effectiveTo : currentSlot.effectiveTo,
      };

      if (candidate.effectiveTo && (!isValidISODate(candidate.effectiveTo) || candidate.effectiveTo < candidate.effectiveFrom)) {
        return badRequest('effectiveTo must be >= effectiveFrom', 'validation');
      }

      const isConflict = checkSlotConflict(candidate, db.timetableSlots, id);
      if (isConflict) {
        return conflict('timetable_conflict', 'Timetable slot conflicts with existing slot');
      }

      const previousSlot: TimetableSlot = {
        ...currentSlot,
        effectiveTo: yesterday,
        updatedAt: nowISO(),
      };
      db.timetableSlots[index] = previousSlot;

      const newSlotId = nextId('slot');
      const newSlot: TimetableSlot = {
        id: newSlotId,
        weekday: candidate.weekday,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        subject: body.subject !== undefined ? body.subject.trim() : currentSlot.subject,
        grade: body.grade !== undefined ? (body.grade?.trim() || undefined) : currentSlot.grade,
        room: body.room !== undefined ? (body.room?.trim() || null) : currentSlot.room,
        tone: body.tone ?? currentSlot.tone,
        effectiveFrom: today,
        effectiveTo: candidate.effectiveTo ?? null,
        updatedAt: nowISO(),
      };
      db.timetableSlots.push(newSlot);

      // Chuyển hoặc bỏ bản ghi đè từ hôm nay trở đi
      if (db.sessionOverrides) {
        const timeOrDayChanged =
          candidate.weekday !== currentSlot.weekday ||
          candidate.startTime !== currentSlot.startTime ||
          candidate.endTime !== currentSlot.endTime;

        db.sessionOverrides = db.sessionOverrides.filter((override) => {
          if (override.timetableSlotId === id && override.date >= today) {
            if (timeOrDayChanged) {
              return false;
            }
            (override as { timetableSlotId: string }).timetableSlotId = newSlotId;
          }
          return true;
        });
      }

      const patchResult: PatchTimetableSlotResult = {
        previous: previousSlot,
        current: newSlot,
      };
      return ok(patchResult);
    }

    // Slot có effectiveFrom >= hôm nay -> Sửa tại chỗ
    const updatedCandidate = {
      weekday: body.weekday ?? currentSlot.weekday,
      startTime: newStartTime,
      endTime: newEndTime,
      effectiveFrom: body.effectiveFrom ?? currentSlot.effectiveFrom,
      effectiveTo: body.effectiveTo !== undefined ? body.effectiveTo : currentSlot.effectiveTo,
    };

    if (updatedCandidate.effectiveTo && (!isValidISODate(updatedCandidate.effectiveTo) || updatedCandidate.effectiveTo < updatedCandidate.effectiveFrom)) {
      return badRequest('effectiveTo must be >= effectiveFrom', 'validation');
    }

    const isConflict = checkSlotConflict(updatedCandidate, db.timetableSlots, id);
    if (isConflict) {
      return conflict('timetable_conflict', 'Timetable slot conflicts with existing slot');
    }

    const updatedSlot: TimetableSlot = {
      ...currentSlot,
      ...body,
      startTime: newStartTime,
      endTime: newEndTime,
      subject: body.subject !== undefined ? body.subject.trim() : currentSlot.subject,
      grade: body.grade !== undefined ? (body.grade?.trim() || undefined) : currentSlot.grade,
      room: body.room !== undefined ? (body.room?.trim() || null) : currentSlot.room,
      updatedAt: nowISO(),
    };

    db.timetableSlots[index] = updatedSlot;
    const patchResult: PatchTimetableSlotResult = { current: updatedSlot };
    return ok(patchResult);
  }),

  route('DELETE', TIMETABLE_SLOT_BY_ID, (request, db) => {
    const { id } = request.params;
    if (!id) return badRequest('Missing id parameter', 'validation');

    const index = db.timetableSlots.findIndex((s) => s.id === id);
    if (index === -1) {
      return notFound('timetable_slot_not_found', 'Timetable slot not found');
    }

    const currentSlot = db.timetableSlots[index]!;
    const today = toISODate(new Date());
    const yesterday = toISODate(addDays(parseISODate(today), -1));

    // SPEC-004: Xoá slot có effectiveFrom < hôm nay -> đặt effectiveTo = hôm qua; ngược lại -> xoá mềm.
    if (currentSlot.effectiveFrom < today) {
      db.timetableSlots[index] = {
        ...currentSlot,
        effectiveTo: yesterday,
        updatedAt: nowISO(),
      };

      if (db.sessionOverrides) {
        db.sessionOverrides = db.sessionOverrides.filter(
          (o) => !(o.timetableSlotId === id && o.date >= today),
        );
      }
      return noContent();
    }

    db.timetableSlots.splice(index, 1);
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [], timetableSlots: [], classSessions: [] };
    }
    if (!db.tombstones.timetableSlots) {
      db.tombstones.timetableSlots = [];
    }
    db.tombstones.timetableSlots.push({ id, deletedAt: nowISO() });

    if (db.sessionOverrides) {
      db.sessionOverrides = db.sessionOverrides.filter((o) => o.timetableSlotId !== id);
    }

    return noContent();
  }),
];
