import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import { ApiError } from '@/lib/api/api-error';
import { generateClientUuid } from '@/lib/sync';
import type {
  AuthSession,
  CreateClassSessionInput,
  CreateTimetableSlotInput,
  Tone,
} from '@/types';

// =============================================================================
// SPEC-004 Full E2E Cross-Repo Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–20 against live NestJS + PostgreSQL.
// Runs on a dedicated port (4003) to avoid collisions with other test runs.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_PORT = process.env.BE_PORT_SPEC004 || '4003';
const BE_URL = `http://localhost:${BE_PORT}`;

let spawnedBe: ChildProcess | null = null;

async function isHttpHealthy(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHttpHealthy(url: string, maxWaitMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isHttpHealthy(url)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function stopProcess(proc: ChildProcess | null): void {
  if (!proc || proc.killed) return;
  try {
    if (process.platform === 'win32' && proc.pid) {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    proc.kill();
  }
}

function createTestClient(options: {
  baseURL?: string;
  ip?: string;
  initialToken?: string | null;
  initialRefreshToken?: string | null;
  onTokenRefreshed?: (session: AuthSession) => void;
}) {
  let token = options.initialToken ?? null;
  let refreshToken = options.initialRefreshToken ?? null;

  const client = createHttpClient({
    baseURL: options.baseURL ?? BE_URL,
    mode: 'http',
    getAccessToken: () => token,
    getRefreshToken: () => refreshToken,
    onTokenRefreshed: (session) => {
      token = session.accessToken;
      refreshToken = session.refreshToken;
      options.onTokenRefreshed?.(session);
    },
  });

  if (options.ip) {
    client.defaults.headers.common['X-Forwarded-For'] = options.ip;
  }

  return {
    client,
    services: createServices(client),
    setToken: (t: string | null) => {
      token = t;
    },
    getToken: () => token,
    setRefreshToken: (rt: string | null) => {
      refreshToken = rt;
    },
    getRefreshToken: () => refreshToken,
  };
}

let ipCounter = 100;
function getNextTestIp(): string {
  ipCounter++;
  const b = Math.floor(ipCounter / 250);
  const c = ipCounter % 250;
  return `10.200.${b}.${c}`;
}

// Helpers for timezone-aware date math matching teacher today
function getTeacherToday(timeZone = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

function offsetIsoDate(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getIsoWeekday(dateStr: string): number {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function getNextDateForWeekday(startDate: string, targetWeekday: number): string {
  let curr = startDate;
  while (getIsoWeekday(curr) !== targetWeekday) {
    curr = offsetIsoDate(curr, 1);
  }
  return curr;
}

describe('SPEC-004 Timetable & Class Sessions E2E Integration Suite (FE ↔ BE live)', { timeout: 30000 }, () => {
  let beAvailable = false;

  beforeAll(async () => {
    if (await isHttpHealthy(BE_URL)) {
      beAvailable = true;
    } else {
      try {
        spawnedBe = spawn(process.execPath, [path.join(BE_DIR, 'dist', 'src', 'main.js')], {
          cwd: BE_DIR,
          env: {
            ...process.env,
            PORT: BE_PORT,
            EMAIL_VERIFICATION_REQUIRED: 'false',
          },
          stdio: 'ignore',
        });
        spawnedBe.on('error', () => {
          beAvailable = false;
        });
        beAvailable = await waitForHttpHealthy(BE_URL, 15000);
      } catch {
        beAvailable = false;
      }
    }
  }, 30000);

  afterAll(async () => {
    stopProcess(spawnedBe);
  });

  // Helper to register and complete onboarding for a fresh teacher
  async function createOnboardedTeacher(name: string, customIp?: string) {
    const ip = customIp ?? getNextTestIp();
    const harness = createTestClient({ baseURL: BE_URL, ip });
    const email = `${name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@cuteteachy.local`;
    const password = 'Password123';
    const reg = await harness.services.auth.register({ email, password });
    harness.setToken(reg.accessToken);
    harness.setRefreshToken(reg.refreshToken);

    await harness.services.auth.updateProfile({
      fullName: `Cô giáo ${name}`,
      displayName: name,
      gender: 'female',
    });

    return { harness, email, password, userId: reg.user.id };
  }

  // ===========================================================================
  // User Stories 1–9: Thời khoá biểu (Timetable Slots)
  // ===========================================================================
  describe('User Stories 1–9: Thời khoá biểu (Timetable Slots)', () => {
    it('US 1: Thêm tiết lặp lại hằng tuần với đầy đủ thông tin chuẩn SPEC-004', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS1');
      const today = getTeacherToday();
      const nextMonth = offsetIsoDate(today, 30);

      const slot = await harness.services.timetableSlots.create({
        weekday: 1, // Thứ Hai
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Sinh học',
        grade: 'Lớp 10A',
        room: 'Phòng 302',
        tone: 'blue',
        effectiveFrom: today,
        effectiveTo: nextMonth,
      });

      expect(typeof slot.id).toBe('string');
      expect(slot.weekday).toBe(1);
      expect(slot.startTime).toBe('07:30');
      expect(slot.endTime).toBe('08:15');
      expect(slot.subject).toBe('Sinh học');
      expect(slot.grade).toBe('Lớp 10A');
      expect(slot.room).toBe('Phòng 302');
      expect(slot.tone).toBe('blue');
      expect(slot.effectiveFrom).toBe(today);
      expect(slot.effectiveTo).toBe(nextMonth);
      expect(typeof slot.updatedAt).toBe('string');
    });

    it('US 2: Chọn màu pastel cho tiết (hỗ trợ đủ 6 pastel tones)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS2');
      const today = getTeacherToday();
      const tones: Tone[] = ['pink', 'blue', 'beige', 'lavender', 'rose', 'mint'];

      for (let i = 0; i < tones.length; i++) {
        const tone = tones[i];
        const slot = await harness.services.timetableSlots.create({
          weekday: (i % 7) + 1,
          startTime: `${String(7 + i).padStart(2, '0')}:00`,
          endTime: `${String(7 + i).padStart(2, '0')}:45`,
          subject: `Môn màu ${tone}`,
          tone,
          effectiveFrom: today,
        });
        expect(slot.tone).toBe(tone);
      }
    });

    it('US 3: Đặt ngày bắt đầu và tùy chọn ngày kết thúc hiệu lực', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS3');
      const today = getTeacherToday();
      const endOfTerm = offsetIsoDate(today, 90);

      // Slot có cả effectiveFrom và effectiveTo
      const slotWithEnd = await harness.services.timetableSlots.create({
        weekday: 2,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Toán học kỳ 1',
        tone: 'pink',
        effectiveFrom: today,
        effectiveTo: endOfTerm,
      });
      expect(slotWithEnd.effectiveFrom).toBe(today);
      expect(slotWithEnd.effectiveTo).toBe(endOfTerm);

      // Slot không có effectiveTo (vô thời hạn / mở)
      const slotOpenEnded = await harness.services.timetableSlots.create({
        weekday: 3,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Toán học kỳ mở',
        tone: 'lavender',
        effectiveFrom: today,
      });
      expect(slotOpenEnded.effectiveFrom).toBe(today);
      expect(slotOpenEnded.effectiveTo == null).toBe(true);
    });

    it('US 4: Để trống lớp hoặc phòng khi không cần thiết', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS4');
      const today = getTeacherToday();

      const slotMinimal = await harness.services.timetableSlots.create({
        weekday: 4,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Chào cờ & Sinh hoạt',
        tone: 'mint',
        effectiveFrom: today,
      });

      expect(slotMinimal.grade).toBeUndefined();
      expect(slotMinimal.room == null).toBe(true);
      expect(slotMinimal.subject).toBe('Chào cờ & Sinh hoạt');
    });

    it('US 5: Kiểm tra 409 timetable_conflict khi trùng giờ cùng thứ trong thời gian hiệu lực (chạm mép không trùng)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS5');
      const today = getTeacherToday();
      const future1 = offsetIsoDate(today, 10);
      const future2 = offsetIsoDate(today, 40);

      // Slot cơ sở: Thứ Hai 07:30–08:15, hiệu lực today -> future2
      await harness.services.timetableSlots.create({
        weekday: 1,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Môn gốc',
        tone: 'blue',
        effectiveFrom: today,
        effectiveTo: future2,
      });

      // 1. Trùng giờ giao nhau (08:00–08:45 giao với 07:30–08:15 từ 08:00 đến 08:15) cùng Thứ Hai -> 409 timetable_conflict
      const conflictErr = await harness.services.timetableSlots
        .create({
          weekday: 1,
          startTime: '08:00',
          endTime: '08:45',
          subject: 'Môn trùng',
          tone: 'rose',
          effectiveFrom: future1,
          effectiveTo: future2,
        })
        .catch((e: unknown) => e);

      expect(conflictErr).toBeInstanceOf(ApiError);
      expect((conflictErr as ApiError).status).toBe(409);
      expect((conflictErr as ApiError).code).toBe('timetable_conflict');

      // 2. Chạm mép trước: 07:00–07:30 (kết thúc đúng lúc slot gốc bắt đầu) -> thành công 201
      const touchBefore = await harness.services.timetableSlots.create({
        weekday: 1,
        startTime: '07:00',
        endTime: '07:30',
        subject: 'Môn chạm mép trước',
        tone: 'pink',
        effectiveFrom: today,
        effectiveTo: future2,
      });
      expect(touchBefore.startTime).toBe('07:00');

      // 3. Chạm mép sau: 08:15–09:00 (bắt đầu đúng lúc slot gốc kết thúc) -> thành công 201
      const touchAfter = await harness.services.timetableSlots.create({
        weekday: 1,
        startTime: '08:15',
        endTime: '09:00',
        subject: 'Môn chạm mép sau',
        tone: 'mint',
        effectiveFrom: today,
        effectiveTo: future2,
      });
      expect(touchAfter.startTime).toBe('08:15');

      // 4. Cùng giờ nhưng khác thứ: Thứ Ba 07:30–08:15 -> thành công 201
      const diffWeekday = await harness.services.timetableSlots.create({
        weekday: 2,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Môn khác thứ',
        tone: 'beige',
        effectiveFrom: today,
        effectiveTo: future2,
      });
      expect(diffWeekday.weekday).toBe(2);

      // 5. Cùng thứ, cùng giờ nhưng thời gian hiệu lực không giao nhau -> thành công 201
      const nextTermStart = offsetIsoDate(future2, 5);
      const nextTermEnd = offsetIsoDate(nextTermStart, 30);
      const nonOverlappingRange = await harness.services.timetableSlots.create({
        weekday: 1,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Môn kỳ sau',
        tone: 'lavender',
        effectiveFrom: nextTermStart,
        effectiveTo: nextTermEnd,
      });
      expect(nonOverlappingRange.effectiveFrom).toBe(nextTermStart);
    });

    it('US 6: Sửa tiết giữa kỳ (tách slot: previous kết thúc hôm qua, current bắt đầu hôm nay; hoặc sửa tại chỗ khi >= hôm nay)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS6');
      const today = getTeacherToday();
      const yesterday = offsetIsoDate(today, -1);
      const pastStart = offsetIsoDate(today, -30);
      const futureEnd = offsetIsoDate(today, 60);

      // 1. Tạo slot bắt đầu trong quá khứ (< today)
      const pastSlot = await harness.services.timetableSlots.create({
        weekday: 5,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Vật lý 10',
        room: 'P.101',
        tone: 'blue',
        effectiveFrom: pastStart,
        effectiveTo: futureEnd,
      });

      // Sửa slot: đổi subject và room -> BE phải tách slot
      const splitResult = await harness.services.timetableSlots.update(pastSlot.id, {
        subject: 'Vật lý 10 Nâng cao',
        room: 'Lab 502',
      });

      expect(splitResult.previous).toBeDefined();
      expect(splitResult.previous?.id).toBe(pastSlot.id);
      expect(splitResult.previous?.subject).toBe('Vật lý 10');
      expect(splitResult.previous?.effectiveTo).toBe(yesterday);

      expect(splitResult.current).toBeDefined();
      expect(splitResult.current.id).not.toBe(pastSlot.id);
      expect(splitResult.current.subject).toBe('Vật lý 10 Nâng cao');
      expect(splitResult.current.room).toBe('Lab 502');
      expect(splitResult.current.effectiveFrom).toBe(today);
      expect(splitResult.current.effectiveTo).toBe(futureEnd);

      // 2. Tạo slot bắt đầu trong tương lai (>= today)
      const futureSlotStart = offsetIsoDate(today, 7);
      const futureSlot = await harness.services.timetableSlots.create({
        weekday: 6,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Hóa học đại cương',
        tone: 'mint',
        effectiveFrom: futureSlotStart,
      });

      // Sửa slot tương lai -> BE sửa tại chỗ, không tách (previous là undefined)
      const inPlaceResult = await harness.services.timetableSlots.update(futureSlot.id, {
        subject: 'Hóa học hữu cơ',
        tone: 'rose',
      });

      expect(inPlaceResult.previous).toBeUndefined();
      expect(inPlaceResult.current.id).toBe(futureSlot.id);
      expect(inPlaceResult.current.subject).toBe('Hóa học hữu cơ');
      expect(inPlaceResult.current.tone).toBe('rose');
    });

    it('US 7: Ngừng tiết từ hôm nay (effectiveTo = hôm qua) mà lịch sử vẫn còn', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS7');
      const today = getTeacherToday();
      const yesterday = offsetIsoDate(today, -1);
      const pastStart = offsetIsoDate(today, -20);
      const futureEnd = offsetIsoDate(today, 40);

      // Slot đã hoạt động từ 20 ngày trước
      const slot = await harness.services.timetableSlots.create({
        weekday: 3,
        startTime: '10:00',
        endTime: '10:45',
        subject: 'Tin học văn phòng',
        tone: 'beige',
        effectiveFrom: pastStart,
        effectiveTo: futureEnd,
      });

      // Ngừng slot từ hôm nay qua DELETE
      await harness.services.timetableSlots.remove(slot.id);

      // Slot không bị xoá mềm (vẫn trả về trong list) nhưng effectiveTo = yesterday
      const list = await harness.services.timetableSlots.list();
      const found = list.items.find((s) => s.id === slot.id);
      expect(found).toBeDefined();
      expect(found?.effectiveTo).toBe(yesterday);
    });

    it('US 8: Xoá hẳn một tiết vừa tạo nhầm (chưa có buổi nào trong quá khứ)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SlotUS8');
      const today = getTeacherToday();
      const futureStart = offsetIsoDate(today, 14);

      // Slot tạo cho 2 tuần sau (chưa có buổi quá khứ nào)
      const slot = await harness.services.timetableSlots.create({
        weekday: 2,
        startTime: '14:00',
        endTime: '14:45',
        subject: 'Môn tạo nhầm',
        tone: 'pink',
        effectiveFrom: futureStart,
      });

      const checkpoint = (await harness.services.timetableSlots.list()).serverTime;

      // Xoá hẳn slot
      await harness.services.timetableSlots.remove(slot.id);

      // Kiểm tra slot không còn trong danh sách active
      const listAfter = await harness.services.timetableSlots.list();
      expect(listAfter.items.some((s) => s.id === slot.id)).toBe(false);

      // Kiểm tra slot xuất hiện trong deletedIds khi đồng bộ delta
      const deltaSync = await harness.services.timetableSlots.list({ updatedSince: checkpoint });
      expect(deltaSync.deletedIds).toContain(slot.id);
    });

    it('US 9: Xem toàn bộ thời khoá biểu hiện hành qua GET /timetable-slots envelope', async () => {
      if (!beAvailable) return;
      const { harness: teacher1 } = await createOnboardedTeacher('SlotUS9A');
      const { harness: teacher2 } = await createOnboardedTeacher('SlotUS9B');
      const today = getTeacherToday();

      // Teacher 1 tạo 2 slot
      const s1 = await teacher1.services.timetableSlots.create({
        weekday: 1,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Slot 1 của T1',
        tone: 'blue',
        effectiveFrom: today,
      });
      const s2 = await teacher1.services.timetableSlots.create({
        weekday: 3,
        startTime: '08:30',
        endTime: '09:15',
        subject: 'Slot 2 của T1',
        tone: 'pink',
        effectiveFrom: today,
      });

      // Teacher 2 tạo slot riêng
      const s3 = await teacher2.services.timetableSlots.create({
        weekday: 1,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Slot của T2',
        tone: 'mint',
        effectiveFrom: today,
      });

      // Teacher 1 gọi GET /timetable-slots
      const envelope1 = await teacher1.services.timetableSlots.list();
      expect(Array.isArray(envelope1.items)).toBe(true);
      expect(Array.isArray(envelope1.deletedIds)).toBe(true);
      expect(typeof envelope1.serverTime).toBe('string');

      const ids1 = envelope1.items.map((s) => s.id);
      expect(ids1).toContain(s1.id);
      expect(ids1).toContain(s2.id);
      expect(ids1).not.toContain(s3.id); // Cô lập dữ liệu: không thấy slot của teacher 2
    });
  });

  // ===========================================================================
  // User Stories 10–17: Tiết dạy từng buổi (Class Sessions)
  // ===========================================================================
  describe('User Stories 10–17: Tiết dạy từng buổi (Class Sessions)', () => {
    it('US 10: Xem tiết dạy tuần/tháng sinh tự động từ thời khoá biểu qua GET /class-sessions?from&to (≤ 42 ngày)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS10');
      const today = getTeacherToday();
      const targetWeekday = 4; // Thứ Năm
      const firstDate = getNextDateForWeekday(today, targetWeekday);
      const secondDate = offsetIsoDate(firstDate, 7);

      const slot = await harness.services.timetableSlots.create({
        weekday: targetWeekday,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Địa lý 11',
        grade: '11B',
        room: 'Phòng 204',
        tone: 'mint',
        effectiveFrom: today,
      });

      // Query khoảng 2 tuần bao hàm cả 2 ngày Thứ Năm
      const from = firstDate;
      const to = offsetIsoDate(secondDate, 2);
      const res = await harness.services.classSessions.list({ from, to });

      expect(res.items.length).toBeGreaterThanOrEqual(2);
      const sess1 = res.items.find((s) => s.date === firstDate);
      const sess2 = res.items.find((s) => s.date === secondDate);

      expect(sess1).toBeDefined();
      expect(sess1?.id).toBe(`${slot.id}:${firstDate}`);
      expect(sess1?.timetableSlotId).toBe(slot.id);
      expect(sess1?.subject).toBe('Địa lý 11');
      expect(sess1?.grade).toBe('11B');
      expect(sess1?.room).toBe('Phòng 204');
      expect(sess1?.tone).toBe('mint');
      expect(sess1?.cancelled).toBe(false);

      expect(sess2).toBeDefined();
      expect(sess2?.id).toBe(`${slot.id}:${secondDate}`);

      // Query > 42 ngày bị từ chối 400 validation
      const badRangeErr = await harness.services.classSessions
        .list({ from: today, to: offsetIsoDate(today, 45) })
        .catch((e: unknown) => e);

      expect(badRangeErr).toBeInstanceOf(ApiError);
      expect((badRangeErr as ApiError).status).toBe(400);
      expect((badRangeErr as ApiError).code).toBe('validation');
    });

    it('US 11: Ghi chủ đề bài dạy (topic) cho một buổi cụ thể', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS11');
      const today = getTeacherToday();
      const sessionDate = getNextDateForWeekday(today, 2); // Thứ Ba

      const slot = await harness.services.timetableSlots.create({
        weekday: 2,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Ngữ văn 10',
        tone: 'pink',
        effectiveFrom: today,
      });

      const generatedId = `${slot.id}:${sessionDate}`;
      const topicText = 'Bài 3: Văn học dân gian Việt Nam';

      const updated = await harness.services.classSessions.update(generatedId, {
        topic: topicText,
      });

      expect(updated.id).toBe(generatedId);
      expect(updated.topic).toBe(topicText);

      // Đọc lại từ GET /class-sessions
      const list = await harness.services.classSessions.list({ from: sessionDate, to: sessionDate });
      expect(list.items[0].topic).toBe(topicText);
    });

    it('US 12: Thêm danh sách việc cần chuẩn bị (prepItems) và tick khi xong', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS12');
      const today = getTeacherToday();
      const sessionDate = getNextDateForWeekday(today, 3); // Thứ Tư

      const slot = await harness.services.timetableSlots.create({
        weekday: 3,
        startTime: '08:30',
        endTime: '09:15',
        subject: 'Vật lý 12',
        tone: 'blue',
        effectiveFrom: today,
      });

      const generatedId = `${slot.id}:${sessionDate}`;

      // Thêm danh sách việc cần chuẩn bị
      const updated1 = await harness.services.classSessions.update(generatedId, {
        prepItems: [
          { id: 'p1', label: 'In đề cương ôn tập chương 2', done: false },
          { id: 'p2', label: 'Chuẩn bị máy chiếu và con trỏ laser', done: false },
        ],
      });
      expect(updated1.prepItems).toHaveLength(2);
      expect(updated1.prepItems[0].done).toBe(false);

      // Tick hoàn thành mục p1
      const updated2 = await harness.services.classSessions.update(generatedId, {
        prepItems: [
          { id: 'p1', label: 'In đề cương ôn tập chương 2', done: true },
          { id: 'p2', label: 'Chuẩn bị máy chiếu và con trỏ laser', done: false },
        ],
      });
      expect(updated2.prepItems[0].done).toBe(true);
      expect(updated2.prepItems[1].done).toBe(false);
    });

    it('US 13: Huỷ một buổi (cancelled=true) mà các tuần khác không đổi, và vẫn thấy buổi đó được đánh dấu đã huỷ', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS13');
      const today = getTeacherToday();
      const firstWeekDate = getNextDateForWeekday(today, 5); // Thứ Sáu tuần 1
      const secondWeekDate = offsetIsoDate(firstWeekDate, 7); // Thứ Sáu tuần 2

      const slot = await harness.services.timetableSlots.create({
        weekday: 5,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Lịch sử 11',
        tone: 'lavender',
        effectiveFrom: today,
      });

      const targetId = `${slot.id}:${firstWeekDate}`;

      // Huỷ buổi thứ nhất
      const cancelledSession = await harness.services.classSessions.update(targetId, {
        cancelled: true,
        topic: 'Nghỉ lễ 20/11',
      });
      expect(cancelledSession.cancelled).toBe(true);
      expect(cancelledSession.topic).toBe('Nghỉ lễ 20/11');

      // GET kiểm tra buổi tuần 1 bị huỷ, buổi tuần 2 không bị ảnh hưởng
      const list = await harness.services.classSessions.list({
        from: firstWeekDate,
        to: secondWeekDate,
      });
      const sess1 = list.items.find((s) => s.date === firstWeekDate);
      const sess2 = list.items.find((s) => s.date === secondWeekDate);
      expect(sess1?.cancelled).toBe(true);
      expect(sess2?.cancelled).toBe(false);
    });

    it('US 14: Khôi phục buổi đã huỷ (cancelled=false)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS14');
      const today = getTeacherToday();
      const firstWeekDate = getNextDateForWeekday(today, 5);

      const slot = await harness.services.timetableSlots.create({
        weekday: 5,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Lịch sử 11',
        tone: 'lavender',
        effectiveFrom: today,
      });

      const targetId = `${slot.id}:${firstWeekDate}`;

      // Huỷ buổi
      await harness.services.classSessions.update(targetId, {
        cancelled: true,
        topic: 'Nghỉ lễ đột xuất',
      });

      // Khôi phục buổi đã huỷ
      const restoredSession = await harness.services.classSessions.update(targetId, {
        cancelled: false,
      });
      expect(restoredSession.cancelled).toBe(false);
      expect(restoredSession.topic).toBe('Nghỉ lễ đột xuất');

      // GET xác nhận cancelled = false
      const list = await harness.services.classSessions.list({
        from: firstWeekDate,
        to: firstWeekDate,
      });
      expect(list.items[0].cancelled).toBe(false);
    });

    it('US 15: Thêm buổi lẻ ad-hoc (timetableSlotId=null) không kiểm trùng với slot', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS15');
      const today = getTeacherToday();
      const testDate = getNextDateForWeekday(today, 1); // Thứ Hai

      // Slot chính khoá Thứ Hai 08:00–08:45
      await harness.services.timetableSlots.create({
        weekday: 1,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Toán chính khoá',
        tone: 'blue',
        effectiveFrom: today,
      });

      // Tạo buổi lẻ trùng giờ exact 08:00–08:45 vào đúng Thứ Hai đó (dạy bù / phụ đạo) -> SPEC: không kiểm trùng slot
      const adHoc = await harness.services.classSessions.create({
        date: testDate,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Dạy bù bồi dưỡng HS giỏi',
        grade: '12 Chuyên',
        room: 'P.Hội thảo',
        tone: 'rose',
        topic: 'Chuyên đề Bất đẳng thức Cauchy',
      });

      expect(typeof adHoc.id).toBe('string');
      expect(adHoc.timetableSlotId).toBeNull();
      expect(adHoc.subject).toBe('Dạy bù bồi dưỡng HS giỏi');

      // GET /class-sessions trả về cả hai buổi
      const list = await harness.services.classSessions.list({ from: testDate, to: testDate });
      expect(list.items).toHaveLength(2);
      expect(list.items.some((s) => s.timetableSlotId !== null)).toBe(true);
      expect(list.items.some((s) => s.timetableSlotId === null)).toBe(true);
    });

    it('US 16: Sửa hoặc xoá buổi lẻ; từ chối DELETE buổi sinh 400 cannot_delete_generated_session', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS16');
      const today = getTeacherToday();
      const testDate = getNextDateForWeekday(today, 6);

      // 1. Tạo buổi lẻ
      const adHoc = await harness.services.classSessions.create({
        date: testDate,
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Buổi ôn tập tự chọn',
        tone: 'beige',
      });

      // Sửa buổi lẻ
      const updatedAdHoc = await harness.services.classSessions.update(adHoc.id, {
        subject: 'Buổi ôn tập nâng cao',
        startTime: '10:15',
        endTime: '11:15',
        room: 'P.303',
      });
      expect(updatedAdHoc.subject).toBe('Buổi ôn tập nâng cao');
      expect(updatedAdHoc.startTime).toBe('10:15');

      // Xoá buổi lẻ -> 204
      await harness.services.classSessions.remove(adHoc.id);

      // GET không còn trả về buổi lẻ
      const listAfter = await harness.services.classSessions.list({ from: testDate, to: testDate });
      expect(listAfter.items.some((s) => s.id === adHoc.id)).toBe(false);

      // 2. Thử xoá buổi sinh từ thời khoá biểu -> bị từ chối 400 cannot_delete_generated_session
      const slot = await harness.services.timetableSlots.create({
        weekday: 6,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Sinh học',
        tone: 'mint',
        effectiveFrom: today,
      });

      const generatedId = `${slot.id}:${testDate}`;
      const deleteGeneratedErr = await harness.services.classSessions
        .remove(generatedId)
        .catch((e: unknown) => e);

      expect(deleteGeneratedErr).toBeInstanceOf(ApiError);
      expect((deleteGeneratedErr as ApiError).status).toBe(400);
      expect((deleteGeneratedErr as ApiError).code).toBe('cannot_delete_generated_session');
    });

    it('US 17: Sửa slot giữa kỳ: giữ nguyên ghi đè quá khứ, chuyển ghi đè tương lai nếu giữ thứ/giờ, bỏ nếu đổi', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SessUS17');
      const today = getTeacherToday();
      const pastStart = offsetIsoDate(today, -30);
      const futureEnd = offsetIsoDate(today, 60);

      // =======================================================================
      // Trường hợp 1: Giữ nguyên thứ và giờ -> chuyển bản ghi đè sang slot mới
      // =======================================================================
      const targetWeekday = 1; // Thứ Hai
      const slot1 = await harness.services.timetableSlots.create({
        weekday: targetWeekday,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Môn gốc',
        tone: 'blue',
        effectiveFrom: pastStart,
        effectiveTo: futureEnd,
      });

      // Tạo override cho một ngày tương lai của slot1
      const futureDate1 = getNextDateForWeekday(offsetIsoDate(today, 7), targetWeekday);
      const generatedId1 = `${slot1.id}:${futureDate1}`;
      await harness.services.classSessions.update(generatedId1, {
        topic: 'Chủ đề bảo lưu',
        prepItems: [{ id: 'p1', label: 'Bảo lưu item', done: false }],
      });

      // Sửa slot: chỉ đổi subject, giữ nguyên thứ (1) và giờ (07:30–08:15)
      const splitResult1 = await harness.services.timetableSlots.update(slot1.id, {
        subject: 'Môn đã đổi tên',
      });
      const newSlotId1 = splitResult1.current.id;

      // GET /class-sessions cho futureDate1: buổi học sinh từ newSlotId1 vẫn giữ nguyên topic và prepItems!
      const sessionsRes1 = await harness.services.classSessions.list({
        from: futureDate1,
        to: futureDate1,
      });
      expect(sessionsRes1.items).toHaveLength(1);
      const migratedSession = sessionsRes1.items[0];
      expect(migratedSession.id).toBe(`${newSlotId1}:${futureDate1}`);
      expect(migratedSession.timetableSlotId).toBe(newSlotId1);
      expect(migratedSession.subject).toBe('Môn đã đổi tên');
      expect(migratedSession.topic).toBe('Chủ đề bảo lưu');
      expect(migratedSession.prepItems[0].label).toBe('Bảo lưu item');

      // =======================================================================
      // Trường hợp 2: Đổi thứ hoặc giờ -> bản ghi đè buổi cũ bị bỏ
      // =======================================================================
      const targetWeekday2 = 2; // Thứ Ba
      const slot2 = await harness.services.timetableSlots.create({
        weekday: targetWeekday2,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Môn đổi thứ',
        tone: 'mint',
        effectiveFrom: pastStart,
        effectiveTo: futureEnd,
      });

      // Tạo override cho Thứ Ba tương lai
      const futureDate2 = getNextDateForWeekday(offsetIsoDate(today, 7), targetWeekday2);
      const generatedId2 = `${slot2.id}:${futureDate2}`;
      await harness.services.classSessions.update(generatedId2, {
        topic: 'Chủ đề sẽ bị bỏ do đổi thứ',
      });

      // Sửa slot: đổi weekday sang Thứ Tư (3)
      await harness.services.timetableSlots.update(slot2.id, {
        weekday: 3,
      });

      // Kiểm tra ngày futureDate2 (Thứ Ba): không còn session nào của slot này
      const sessionsRes2 = await harness.services.classSessions.list({
        from: futureDate2,
        to: futureDate2,
      });
      expect(sessionsRes2.items.some((s) => s.timetableSlotId === slot2.id)).toBe(false);
    });
  });

  // ===========================================================================
  // User Stories 18–20: Mobile & Đồng bộ (Delta Sync & Idempotency)
  // ===========================================================================
  describe('User Stories 18–20: Mobile & Đồng bộ (Delta Sync & Idempotency)', () => {
    it('US 18: Delta sync GET /class-sessions với updatedSince (trả toàn bộ khi slot đổi, chỉ trả buổi đổi khi slot không đổi)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('SyncUS18');
      const today = getTeacherToday();
      const testWeekday = 3; // Thứ Tư
      const futureDate = getNextDateForWeekday(today, testWeekday);
      const dateRangeEnd = offsetIsoDate(futureDate, 14);

      // 1. Tạo slot S1
      const slot = await harness.services.timetableSlots.create({
        weekday: testWeekday,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Tiếng Anh 10',
        tone: 'pink',
        effectiveFrom: today,
      });

      // Tạo ad-hoc session A1
      const adHoc = await harness.services.classSessions.create({
        date: futureDate,
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Tăng cường phát âm',
        tone: 'mint',
      });

      // First sync checkpoint
      const sync1 = await harness.services.classSessions.list({
        from: futureDate,
        to: dateRangeEnd,
      });
      const checkpoint1 = sync1.serverTime;
      await new Promise((r) => setTimeout(r, 100));

      // Không đổi slot, chỉ cập nhật topic buổi sinh và xoá ad-hoc session
      await harness.services.classSessions.update(`${slot.id}:${futureDate}`, {
        topic: 'Unit 4: Special Education',
      });
      await harness.services.classSessions.remove(adHoc.id);

      // Delta sync query: chỉ trả buổi sinh đã đổi, deletedIds chứa adHoc.id
      const delta1 = await harness.services.classSessions.list({
        from: futureDate,
        to: dateRangeEnd,
        updatedSince: checkpoint1,
      });

      expect(delta1.items).toHaveLength(1);
      expect(delta1.items[0].id).toBe(`${slot.id}:${futureDate}`);
      expect(delta1.items[0].topic).toBe('Unit 4: Special Education');
      expect(delta1.deletedIds).toContain(adHoc.id);

      // 2. Khi có slot thay đổi sau checkpoint -> SPEC: trả toàn bộ các buổi trong khoảng
      const checkpoint2 = delta1.serverTime;
      await new Promise((r) => setTimeout(r, 100));

      // Thêm slot mới S2 cùng khoảng ngày
      await harness.services.timetableSlots.create({
        weekday: testWeekday,
        startTime: '14:00',
        endTime: '14:45',
        subject: 'Tin học thực hành',
        tone: 'blue',
        effectiveFrom: today,
      });

      const delta2 = await harness.services.classSessions.list({
        from: futureDate,
        to: dateRangeEnd,
        updatedSince: checkpoint2,
      });

      // Trả về toàn bộ các buổi sinh của cả S1 và S2 trong khoảng
      expect(delta2.items.length).toBeGreaterThanOrEqual(2);
      expect(delta2.items.some((s) => s.subject === 'Tiếng Anh 10')).toBe(true);
      expect(delta2.items.some((s) => s.subject === 'Tin học thực hành')).toBe(true);
    });

    it('US 19: Kịch bản hai thiết bị đồng bộ thời khoá biểu và chi tiết buổi', async () => {
      if (!beAvailable) return;
      const { harness: dev1, email, password } = await createOnboardedTeacher('TwoDevUS19');
      const today = getTeacherToday();
      const testDate = getNextDateForWeekday(today, 5); // Thứ Sáu

      // Thiết bị 2 đăng nhập bằng cùng tài khoản
      const dev2 = createTestClient({ baseURL: BE_URL, ip: getNextTestIp() });
      const loginRes = await dev2.services.auth.login({ email, password });
      dev2.setToken(loginRes.accessToken);
      dev2.setRefreshToken(loginRes.refreshToken);

      // Thiết bị 1 tạo slot và buổi lẻ
      const slot = await dev1.services.timetableSlots.create({
        weekday: 5,
        startTime: '08:00',
        endTime: '08:45',
        subject: 'Toán giải tích',
        tone: 'blue',
        effectiveFrom: today,
      });

      const adHoc = await dev1.services.classSessions.create({
        date: testDate,
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Giải đề thi thử',
        tone: 'rose',
      });

      // Thiết bị 2 đồng bộ lần đầu (Initial Sync)
      const dev2Sync1 = await dev2.services.classSessions.list({ from: testDate, to: testDate });
      expect(dev2Sync1.items).toHaveLength(2);
      const checkpointDev2 = dev2Sync1.serverTime;
      await new Promise((r) => setTimeout(r, 100));

      // Thiết bị 1 ghi đè buổi học (thêm topic và prepItems)
      await dev1.services.classSessions.update(`${slot.id}:${testDate}`, {
        topic: 'Ôn tập chương hàm số',
        prepItems: [{ id: 'p1', label: 'Chuẩn bị bài tập nhóm', done: false }],
      });

      // Thiết bị 2 sync delta -> nhận được topic và prepItem
      const dev2Delta = await dev2.services.classSessions.list({
        from: testDate,
        to: testDate,
        updatedSince: checkpointDev2,
      });
      expect(dev2Delta.items).toHaveLength(1);
      expect(dev2Delta.items[0].topic).toBe('Ôn tập chương hàm số');
      expect(dev2Delta.items[0].prepItems[0].done).toBe(false);

      // Thiết bị 2 tick hoàn thành prepItem
      const checkpointDev1 = dev2Delta.serverTime;
      await dev2.services.classSessions.update(`${slot.id}:${testDate}`, {
        prepItems: [{ id: 'p1', label: 'Chuẩn bị bài tập nhóm', done: true }],
      });

      // Thiết bị 1 sync delta -> thấy item đã done
      const dev1Delta = await dev1.services.classSessions.list({
        from: testDate,
        to: testDate,
        updatedSince: checkpointDev1,
      });
      expect(dev1Delta.items[0].prepItems[0].done).toBe(true);

      // Thiết bị 1 xoá buổi lẻ adHoc
      const checkpointBeforeDel = dev1Delta.serverTime;
      await dev1.services.classSessions.remove(adHoc.id);

      // Thiết bị 2 sync delta -> nhận adHoc.id trong deletedIds
      const dev2FinalSync = await dev2.services.classSessions.list({
        from: testDate,
        to: testDate,
        updatedSince: checkpointBeforeDel,
      });
      expect(dev2FinalSync.deletedIds).toContain(adHoc.id);
    });

    it('US 20: Tạo/sửa offline gửi lại idempotent (trùng payload 200/201, khác payload 409 conflict, id account khác 409 id_conflict, id đã xoá mềm 410 gone)', async () => {
      if (!beAvailable) return;
      const { harness: teacherA } = await createOnboardedTeacher('IdempA');
      const { harness: teacherB } = await createOnboardedTeacher('IdempB');
      const today = getTeacherToday();

      // =======================================================================
      // 1. TimetableSlot Idempotency
      // =======================================================================
      const slotId = generateClientUuid();
      const slotPayload: CreateTimetableSlotInput = {
        id: slotId,
        weekday: 2,
        startTime: '07:30',
        endTime: '08:15',
        subject: 'Vật lý offline',
        tone: 'lavender',
        effectiveFrom: today,
      };

      // Gửi lần đầu -> 201 Created
      const res1 = await teacherA.services.timetableSlots.create(slotPayload);
      expect(res1.id).toBe(slotId);

      // Gửi lại nguyên vẹn payload -> 200 OK (idempotent)
      const res2 = await teacherA.services.timetableSlots.create(slotPayload);
      expect(res2.id).toBe(slotId);
      expect(res2.subject).toBe('Vật lý offline');

      // Gửi lại cùng id nhưng khác payload -> 409 conflict
      const diffErr = await teacherA.services.timetableSlots
        .create({ ...slotPayload, subject: 'Vật lý đổi tên trái phép' })
        .catch((e: unknown) => e);
      expect(diffErr).toBeInstanceOf(ApiError);
      expect((diffErr as ApiError).status).toBe(409);
      expect((diffErr as ApiError).code).toBe('conflict');

      // Teacher B cố dùng ID này -> 409 id_conflict
      const crossTeacherErr = await teacherB.services.timetableSlots
        .create(slotPayload)
        .catch((e: unknown) => e);
      expect(crossTeacherErr).toBeInstanceOf(ApiError);
      expect((crossTeacherErr as ApiError).status).toBe(409);
      expect((crossTeacherErr as ApiError).code).toBe('id_conflict');

      // =======================================================================
      // 2. ClassSession Ad-hoc Idempotency & 410 gone
      // =======================================================================
      const adHocId = generateClientUuid();
      const adHocPayload: CreateClassSessionInput = {
        id: adHocId,
        date: today,
        startTime: '15:00',
        endTime: '16:00',
        subject: 'Bồi dưỡng học sinh giỏi',
        tone: 'rose',
      };

      // Tạo buổi lẻ lần 1 -> 201 Created
      const adHocRes1 = await teacherA.services.classSessions.create(adHocPayload);
      expect(adHocRes1.id).toBe(adHocId);

      // Gửi lại cùng payload -> 200 OK (idempotent)
      const adHocRes2 = await teacherA.services.classSessions.create(adHocPayload);
      expect(adHocRes2.id).toBe(adHocId);

      // Xoá mềm buổi lẻ
      await teacherA.services.classSessions.remove(adHocId);

      // Cố tạo lại với id đã xoá mềm -> 410 gone
      const goneErr = await teacherA.services.classSessions
        .create(adHocPayload)
        .catch((e: unknown) => e);
      expect(goneErr).toBeInstanceOf(ApiError);
      expect((goneErr as ApiError).status).toBe(410);
      expect((goneErr as ApiError).code).toBe('gone');
    });
  });
});
