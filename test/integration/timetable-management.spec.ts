import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, parseISODate, toISODate } from '@/utils';
import { createMockDb, type MockDb } from '@/testing/mocks/mock-db';
import { matchRoute } from '@/testing/mocks/mock-router';
import { mockRoutes } from '@/testing/mocks/handlers';
import type { CreateTimetableSlotInput, PatchTimetableSlotResult, TimetableSlot } from '@/types';

describe('SPEC-004 Timetable Management User Stories 1–9 Integration Suite', () => {
  let db: MockDb;
  const today = toISODate(new Date());
  const yesterday = toISODate(addDays(parseISODate(today), -1));

  beforeEach(() => {
    db = createMockDb(new Date());
  });

  const callApi = (
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    query: Record<string, string> = {},
  ) => {
    const matched = matchRoute(mockRoutes, method, path);
    if (!matched) throw new Error(`No mock route matched: ${method} ${path}`);
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

  it('US 1–4: Tạo slot mới lặp lại hằng tuần với đầy đủ trường hoặc để trống lớp/phòng', () => {
    const inputWithAllFields: CreateTimetableSlotInput = {
      weekday: 6, // Thứ Bảy
      startTime: '07:30',
      endTime: '08:15',
      subject: 'Sinh học',
      grade: 'Lớp 10A',
      room: 'Phòng 302',
      tone: 'blue',
      effectiveFrom: today,
      effectiveTo: '2027-05-31',
    };

    const res1 = callApi('POST', '/timetable-slots', inputWithAllFields);
    expect(res1.status).toBe(201);
    const createdSlot1 = res1.data as TimetableSlot;
    expect(createdSlot1.id).toBeDefined();
    expect(createdSlot1.weekday).toBe(6);
    expect(createdSlot1.subject).toBe('Sinh học');
    expect(createdSlot1.grade).toBe('Lớp 10A');
    expect(createdSlot1.room).toBe('Phòng 302');
    expect(createdSlot1.tone).toBe('blue');
    expect(createdSlot1.effectiveFrom).toBe(today);
    expect(createdSlot1.effectiveTo).toBe('2027-05-31');

    // US 4: Để trống lớp hoặc phòng
    const inputMinimal: CreateTimetableSlotInput = {
      weekday: 6,
      startTime: '08:30',
      endTime: '09:15',
      subject: 'Chào cờ & Sinh hoạt',
      tone: 'mint',
      effectiveFrom: today,
    };

    const res2 = callApi('POST', '/timetable-slots', inputMinimal);
    expect(res2.status).toBe(201);
    const createdSlot2 = res2.data as TimetableSlot;
    expect(createdSlot2.grade).toBeUndefined();
    expect(createdSlot2.room).toBeNull();
    expect(createdSlot2.effectiveTo).toBeNull();
  });

  it('US 5: Báo lỗi 409 timetable_conflict khi trùng lịch cùng thứ, giờ giao nhau, hiệu lực giao nhau', () => {
    // Thứ Bảy 07:30 - 08:15
    callApi('POST', '/timetable-slots', {
      weekday: 6,
      startTime: '07:30',
      endTime: '08:15',
      subject: 'Toán',
      tone: 'blue',
      effectiveFrom: today,
    });

    // Thử tạo tiết Thứ Bảy 08:00 - 08:45 (giao nhau từ 08:00 đến 08:15)
    const conflictRes = callApi('POST', '/timetable-slots', {
      weekday: 6,
      startTime: '08:00',
      endTime: '08:45',
      subject: 'Văn',
      tone: 'rose',
      effectiveFrom: today,
    });

    expect(conflictRes.status).toBe(409);
    expect((conflictRes.data as { code: string }).code).toBe('timetable_conflict');
  });

  it('US 6: Sửa slot đã bắt đầu (effectiveFrom < hôm nay) -> tách slot cũ (kết thúc hôm qua) và slot mới (bắt đầu hôm nay)', () => {
    // slot-wed-1 có sẵn trong seed với effectiveFrom = '2026-01-01' (< today)
    const originalSlot = db.timetableSlots.find((s) => s.id === 'slot-wed-1')!;
    expect(originalSlot.effectiveFrom < today).toBe(true);

    // Giáo viên sửa môn và phòng
    const patchRes = callApi('PATCH', '/timetable-slots/slot-wed-1', {
      subject: 'Sinh học ứng dụng',
      room: 'Phòng 205',
    });

    expect(patchRes.status).toBe(200);
    const data = patchRes.data as PatchTimetableSlotResult;

    // Slot cũ kết thúc vào hôm qua (các tuần đã qua giữ nguyên)
    expect(data.previous).toBeDefined();
    expect(data.previous?.id).toBe('slot-wed-1');
    expect(data.previous?.effectiveTo).toBe(yesterday);

    // Slot mới áp dụng từ hôm nay với giá trị mới
    expect(data.current).toBeDefined();
    expect(data.current.id).not.toBe('slot-wed-1');
    expect(data.current.subject).toBe('Sinh học ứng dụng');
    expect(data.current.room).toBe('Phòng 205');
    expect(data.current.effectiveFrom).toBe(today);

    // Cả hai bản ghi đều hiện diện trong DB
    const prevInDb = db.timetableSlots.find((s) => s.id === 'slot-wed-1');
    const currInDb = db.timetableSlots.find((s) => s.id === data.current.id);
    expect(prevInDb?.effectiveTo).toBe(yesterday);
    expect(currInDb?.subject).toBe('Sinh học ứng dụng');
  });

  it('US 7: Ngừng một tiết đã bắt đầu từ hôm nay (effectiveFrom < hôm nay) -> đặt effectiveTo = hôm qua', () => {
    // slot-mon-1 có effectiveFrom: '2026-01-01' (< today)
    const deleteRes = callApi('DELETE', '/timetable-slots/slot-mon-1');
    expect(deleteRes.status).toBe(204);

    const slotInDb = db.timetableSlots.find((s) => s.id === 'slot-mon-1');
    expect(slotInDb).toBeDefined();
    expect(slotInDb?.effectiveTo).toBe(yesterday);
    expect(db.tombstones?.timetableSlots?.some((t) => t.id === 'slot-mon-1')).toBeFalsy();
  });

  it('US 8: Xoá hẳn một tiết vừa tạo nhầm (effectiveFrom >= hôm nay) -> xoá mềm và ghi tombstone', () => {
    const futureDate = toISODate(addDays(parseISODate(today), 7));
    const futureSlot: TimetableSlot = {
      id: 'slot-delete-permanently',
      weekday: 5,
      startTime: '15:00',
      endTime: '16:30',
      subject: 'Giáo dục công dân',
      tone: 'pink',
      effectiveFrom: futureDate,
      effectiveTo: null,
      updatedAt: '2026-10-01T00:00:00Z',
    };
    db.timetableSlots.push(futureSlot);

    const deleteRes = callApi('DELETE', '/timetable-slots/slot-delete-permanently');
    expect(deleteRes.status).toBe(204);

    expect(db.timetableSlots.some((s) => s.id === 'slot-delete-permanently')).toBe(false);
    expect(db.tombstones?.timetableSlots?.some((t) => t.id === 'slot-delete-permanently')).toBe(true);
  });

  it('US 9: Xem toàn bộ thời khoá biểu qua GET /timetable-slots', () => {
    const getRes = callApi('GET', '/timetable-slots');
    expect(getRes.status).toBe(200);
    const data = getRes.data as { items: TimetableSlot[] };
    expect(data.items.length).toBeGreaterThan(0);
  });
});
