import type { ClassSession, CreateClassSessionInput, UpdateClassSessionInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  generateClassSessions,
  isValidISODate,
  isValidTime,
  parseISODate,
} from '@/utils';
import {
  badRequest,
  created,
  noContent,
  notFound,
  ok,
  route,
} from '../mock-router';
import { createMockSyncEnvelope, validateUpdatedSince } from '../mock-sync';
import { nextId, nowISO } from './handler.utils';

const CLASS_SESSION_BY_ID = ENDPOINTS.classSessions.byId(':id');
const MAX_DATE_RANGE_DAYS = 42;

export const classSessionRoutes = [
  route('GET', ENDPOINTS.classSessions.root, (request, db) => {
    const { from, to, updatedSince } = request.query;

    if (!from || !to) {
      return badRequest('from and to are required in YYYY-MM-DD format', 'validation');
    }

    if (!isValidISODate(from)) {
      return badRequest('from is not a valid calendar date', 'validation');
    }

    if (!isValidISODate(to)) {
      return badRequest('to is not a valid calendar date', 'validation');
    }

    const fromDate = parseISODate(from);
    const toDate = parseISODate(to);

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

    const allSessions = generateClassSessions(
      db.timetableSlots,
      db.sessionOverrides,
      db.adhocSessions,
      from,
      to,
    );

    if (!updatedSince) {
      return ok(createMockSyncEnvelope(allSessions, [], now.toISOString()));
    }

    // SPEC-004 delta sync rules:
    // Có slot của giáo viên đổi (tạo/sửa/tách/kết thúc/xoá) sau mốc → trả toàn bộ khoảng.
    const anySlotChanged =
      db.timetableSlots.some((slot) => slot.updatedAt > updatedSince) ||
      (db.tombstones?.timetableSlots ?? []).some((t) => t.deletedAt > updatedSince);

    const items = anySlotChanged
      ? allSessions
      : allSessions.filter((session) => session.updatedAt > updatedSince);

    const deletedIds = (db.tombstones?.classSessions ?? [])
      .filter((t) => t.deletedAt > updatedSince)
      .map((t) => t.id);

    return ok(createMockSyncEnvelope(items, deletedIds, now.toISOString()));
  }),

  route('POST', ENDPOINTS.classSessions.root, (request, db) => {
    const body = request.body as CreateClassSessionInput | null | undefined;
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    const { date, startTime, endTime, subject, grade, room, tone, topic, prepItems, id } = body;

    if (!date || !isValidISODate(date)) {
      return badRequest('date must be a valid YYYY-MM-DD string', 'validation');
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

    // Buổi lẻ: timetableSlotId = null
    const adhocSession: ClassSession = {
      id: id ?? nextId('adhoc'),
      timetableSlotId: null,
      subject: subject.trim(),
      grade: grade?.trim() || undefined,
      room: room?.trim() || null,
      date,
      startTime,
      endTime,
      tone: tone ?? 'mint',
      topic: topic?.trim() || undefined,
      prepItems: prepItems ?? [],
      cancelled: false,
      updatedAt: nowISO(),
    };

    db.adhocSessions.push(adhocSession);
    return created(adhocSession);
  }),

  route('PATCH', CLASS_SESSION_BY_ID, (request, db) => {
    const { id } = request.params;
    const body = request.body as UpdateClassSessionInput | null | undefined;
    if (!id) return badRequest('Missing id parameter', 'validation');
    if (!body || typeof body !== 'object') {
      return badRequest('Invalid request body', 'validation');
    }

    // Case 1: Ad-hoc session
    const adhocIndex = db.adhocSessions.findIndex((s) => s.id === id);
    if (adhocIndex !== -1) {
      const current = db.adhocSessions[adhocIndex]!;
      const updated: ClassSession = {
        ...current,
        ...body,
        grade: body.grade !== undefined ? (body.grade?.trim() || undefined) : current.grade,
        room: body.room !== undefined ? (body.room?.trim() || null) : current.room,
        updatedAt: nowISO(),
      };
      db.adhocSessions[adhocIndex] = updated;
      return ok(updated);
    }

    // Case 2: Generated session from timetable slot (id: cs_${slotId}_${date})
    const match = id.match(/^cs_(.+)_(.+)$/);
    if (!match) {
      return notFound('class_session_not_found', 'Class session not found');
    }

    const slotId = match[1]!;
    const sessionDate = match[2]!;

    const slot = db.timetableSlots.find((s) => s.id === slotId);
    if (!slot) {
      return notFound('timetable_slot_not_found', 'Timetable slot not found');
    }

    let override = db.sessionOverrides.find(
      (o) => o.timetableSlotId === slotId && o.date === sessionDate,
    );

    const now = nowISO();
    if (override) {
      const overrideIndex = db.sessionOverrides.indexOf(override);
      const updatedOverride = {
        ...override,
        topic: body.topic !== undefined ? body.topic : override.topic,
        prepItems: body.prepItems !== undefined ? body.prepItems : override.prepItems,
        cancelled: body.cancelled !== undefined ? body.cancelled : override.cancelled,
        updatedAt: now,
      };
      db.sessionOverrides[overrideIndex] = updatedOverride;
      override = updatedOverride;
    } else {
      override = {
        timetableSlotId: slotId,
        date: sessionDate,
        topic: body.topic,
        prepItems: body.prepItems ?? [],
        cancelled: body.cancelled ?? false,
        updatedAt: now,
      };
      db.sessionOverrides.push(override);
    }

    const session: ClassSession = {
      id,
      timetableSlotId: slot.id,
      subject: slot.subject,
      grade: slot.grade,
      room: slot.room ?? null,
      date: sessionDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      tone: slot.tone,
      topic: override.topic,
      prepItems: override.prepItems ?? [],
      cancelled: override.cancelled ?? false,
      updatedAt: now,
    };

    return ok(session);
  }),

  route('DELETE', CLASS_SESSION_BY_ID, (request, db) => {
    const { id } = request.params;
    if (!id) return badRequest('Missing id parameter', 'validation');

    // Generated session cannot be deleted: SPEC-004
    if (id.startsWith('cs_')) {
      return badRequest('Cannot delete generated session', 'cannot_delete_generated_session');
    }

    // Ad-hoc session soft delete
    const adhocIndex = db.adhocSessions.findIndex((s) => s.id === id);
    if (adhocIndex === -1) {
      return notFound('class_session_not_found', 'Class session not found');
    }

    db.adhocSessions.splice(adhocIndex, 1);
    if (!db.tombstones) {
      db.tombstones = { tags: [], tasks: [], notes: [], timetableSlots: [], classSessions: [] };
    }
    if (!db.tombstones.classSessions) {
      db.tombstones.classSessions = [];
    }
    db.tombstones.classSessions.push({ id, deletedAt: nowISO() });

    return noContent();
  }),
];
