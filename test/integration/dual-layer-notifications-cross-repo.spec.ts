import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import { ApiError } from '@/lib/api/api-error';
import {
  buildReminderTag,
  computeNoteRemindAt,
  evaluateDueReminders,
  runReminderTick,
  type MinimalStorage,
} from '@/features/notifications/utils/local-reminder-ticker';
import {
  evaluatePushDecision,
  isIosDevice,
} from '@/features/push/utils/push-helpers';
import { formatPushNotification } from '@/lib/push/format-notification';
import type { AuthSession } from '@/types';

// =============================================================================
// SPEC-006 Full E2E Cross-Repo Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–14 from SPEC-006 against live NestJS + PostgreSQL
// using FakePushSender via NestJS overrideProvider (preserves SSRF protection).
// Runs on a dedicated port (4006) to avoid collisions with other test runs.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_PORT = Number(process.env.BE_PORT_SPEC006 || '4006');
const BE_URL = `http://localhost:${BE_PORT}`;
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret-token';
const PUSH_ENDPOINT_BASE = 'https://fcm.googleapis.com/fcm/send';

const beRequire = createRequire(path.join(BE_DIR, 'package.json'));

interface NestAppHandle {
  listen(port: number | string): Promise<unknown>;
  close(): Promise<void>;
}

interface ReceivedPush {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

const receivedPushes: ReceivedPush[] = [];
let nextPushStatus = 201;

function extractPushPath(endpoint: string): string {
  try {
    return new URL(endpoint).pathname.replace(/^\/fcm\/send/, '');
  } catch {
    return endpoint;
  }
}

function formatInTimeZone(
  date: Date,
  timeZone: string,
): { date: string; time: string; weekday: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;

  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const jsDay = utcDate.getUTCDay();
  const weekday = jsDay === 0 ? 7 : jsDay;

  return { date: dateStr, time: timeStr, weekday };
}

function getDueTargetTime(
  leadMinutes: number,
  timeZone: string,
  bufferMinutes = 2,
): { date: string; time: string; weekday: number } {
  // remindAt = targetTime - leadMinutes ≈ now - bufferMinutes (inside (now - 10m, now])
  const now = Date.now();
  const targetTimeMs = now - bufferMinutes * 60 * 1000 + leadMinutes * 60 * 1000;
  return formatInTimeZone(new Date(targetTimeMs), timeZone);
}

/**
 * Finds a valid IANA timezone where current local time is around 07:01–07:08 AM
 * (so a date-only Note due today at 07:00 is inside the (now - 10m, now] dispatch window),
 * or falls back to a canonical Etc/GMT±N zone that puts local time at ~07:02 AM.
 */
function findTimeZoneForLocalHourMinute(targetHour: number, minMinute = 1, maxMinute = 8): {
  timeZone: string;
  localDate: string;
  localTime: string;
  tomorrowDate: string;
} {
  const now = new Date();
  const candidateZones = [
    'Asia/Ho_Chi_Minh',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Seoul',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/Moscow',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Pacific/Auckland',
    'Pacific/Honolulu',
    ...Array.from({ length: 27 }, (_, i) => {
      const offset = i - 12; // -12 to +14
      if (offset === 0) return 'Etc/GMT';
      return offset > 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${Math.abs(offset)}`;
    }),
  ];

  // If current UTC minute is > maxMinute, shift targetHour by 1 or use a half-hour / 45-min zone
  const extraZones = [
    'Asia/Kolkata', // +5:30
    'Asia/Yangon', // +6:30
    'Asia/Tehran', // +3:30
    'Asia/Kabul', // +4:30
    'Australia/Adelaide', // +9:30/+10:30
    'Australia/Darwin', // +9:30
    'America/St_Johns', // -3:30/-2:30
    'Asia/Kathmandu', // +5:45
    'Pacific/Chatham', // +12:45/+13:45
    'Australia/Eucla', // +8:45
    'Pacific/Marquesas', // -9:30
  ];

  const allZones = [...candidateZones, ...extraZones];

  for (const tz of allZones) {
    try {
      const formatted = formatInTimeZone(now, tz);
      const [h, m] = formatted.time.split(':').map(Number);
      if (h === targetHour && m >= minMinute && m <= maxMinute) {
        const [y, mo, d] = formatted.date.split('-').map(Number);
        const tmrw = new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10);
        return {
          timeZone: tz,
          localDate: formatted.date,
          localTime: formatted.time,
          tomorrowDate: tmrw,
        };
      }
    } catch {
      // Ignore unsupported timezone
    }
  }

  // Fallback: pick any zone where h === targetHour (even if minute > maxMinute)
  for (const tz of allZones) {
    try {
      const formatted = formatInTimeZone(now, tz);
      const [h] = formatted.time.split(':').map(Number);
      if (h === targetHour) {
        const [y, mo, d] = formatted.date.split('-').map(Number);
        const tmrw = new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10);
        return {
          timeZone: tz,
          localDate: formatted.date,
          localTime: formatted.time,
          tomorrowDate: tmrw,
        };
      }
    } catch {
      // Ignore
    }
  }

  const fallback = formatInTimeZone(now, 'Asia/Ho_Chi_Minh');
  const [y, mo, d] = fallback.date.split('-').map(Number);
  const tmrw = new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10);
  return {
    timeZone: 'Asia/Ho_Chi_Minh',
    localDate: fallback.date,
    localTime: fallback.time,
    tomorrowDate: tmrw,
  };
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

let ipCounter = 600;
function getNextTestIp(): string {
  ipCounter++;
  const b = Math.floor(ipCounter / 250);
  const c = ipCounter % 250;
  return `10.206.${b}.${c}`;
}

async function createOnboardedTeacher(name: string, customIp?: string) {
  const ip = customIp ?? getNextTestIp();
  const harness = createTestClient({ baseURL: BE_URL, ip });
  const email = `${name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@cuteteachy.local`;
  const password = 'Password123';
  const reg = await harness.services.auth.register({ email, password });
  harness.setToken(reg.accessToken);
  harness.setRefreshToken(reg.refreshToken);

  await harness.services.auth.updateProfile({
    fullName: `Cô giáo ${name.slice(0, 15)}`,
    displayName: name.slice(0, 15),
    gender: 'female',
  });

  return { harness, email, password, userId: reg.user.id };
}

interface DispatchResponseBody {
  sent?: number;
  skipped?: number;
  message?: string;
  statusCode?: number;
}

async function callDispatch(
  secret: string = CRON_SECRET,
): Promise<{ status: number; body: DispatchResponseBody }> {
  const res = await fetch(`${BE_URL}/internal/reminders/dispatch`, {
    method: 'POST',
    headers: {
      'X-Cron-Secret': secret,
    },
  });
  const body = (await res.json().catch(() => ({}))) as DispatchResponseBody;
  return { status: res.status, body };
}

const DUMMY_KEYS_1 = {
  p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=',
  auth: 'tBHItJI5svbpez7KI4CCXg==',
};

describe('SPEC-006 Dual-Layer Notifications & Note Reminders Cross-Repo Integration Suite (FE ↔ BE live)', { timeout: 60000 }, () => {
  let app: NestAppHandle | null = null;
  let beAvailable = false;

  beforeAll(async () => {
    process.env.EMAIL_VERIFICATION_REQUIRED = 'false';

    try {
      const { Test } = beRequire('@nestjs/testing');
      const { AppModule } = beRequire(path.join(BE_DIR, 'dist/src/composition/app.module'));
      const { setupApp } = beRequire(path.join(BE_DIR, 'dist/src/setup-app'));
      const { PUSH_SENDER, PushSubscriptionExpiredError } = beRequire(
        path.join(BE_DIR, 'dist/src/application/push-subscription/ports/push-sender.port'),
      );

      const fakePushSender = {
        getVapidPublicKey: () =>
          'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
        send: async (
          target: { endpoint: string; keys: { p256dh: string; auth: string } },
          payload: Record<string, unknown>,
        ) => {
          receivedPushes.push({
            endpoint: extractPushPath(target.endpoint),
            method: 'POST',
            headers: {},
            body: JSON.stringify(payload),
          });
          if (nextPushStatus === 404 || nextPushStatus === 410) {
            throw new PushSubscriptionExpiredError(target.endpoint, `HTTP ${nextPushStatus} expired`);
          }
        },
      };

      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PUSH_SENDER)
        .useValue(fakePushSender)
        .compile();

      app = moduleFixture.createNestApplication();
      setupApp(app);
      await app!.listen(BE_PORT);
      beAvailable = true;
    } catch {
      beAvailable = false;
      app = null;
    }
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  // ===========================================================================
  // 1. Note remindTime HTTP Contract (FE noteService ↔ BE /notes)
  // ===========================================================================
  describe('US 9, 10, 11, 12: Note remindTime CRUD & Validation qua FE noteService ↔ BE /notes', () => {
    it('tạo Note có dueDate + remindTime (HH:mm), cập nhật remindTime, xoá remindTime về null và đồng bộ qua GET /notes', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('NoteRemindCrud');

      // 1. Tạo Note có dueDate + remindTime
      const created = await harness.services.notes.create({
        title: 'Nộp đề cương ôn tập học kỳ 1',
        content: 'Gửi tổ trưởng chuyên môn trước buổi họp',
        dueDate: '2026-11-15',
        remindTime: '14:30',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Nộp đề cương ôn tập học kỳ 1');
      expect(created.dueDate).toBe('2026-11-15');
      expect(created.remindTime).toBe('14:30');

      // 2. Tạo Note chỉ có dueDate (không truyền remindTime)
      const dateOnlyNote = await harness.services.notes.create({
        title: 'Ghi chú nhắc 07:00 sáng',
        dueDate: '2026-11-16',
      });
      expect(dateOnlyNote.dueDate).toBe('2026-11-16');
      expect(dateOnlyNote.remindTime ?? null).toBeNull();

      // 3. GET /notes trả về đúng remindTime cho cả 2 Note
      const listed = await harness.services.notes.list();
      const foundTimed = listed.items.find((n) => n.id === created.id);
      const foundDateOnly = listed.items.find((n) => n.id === dateOnlyNote.id);
      expect(foundTimed?.remindTime).toBe('14:30');
      expect(foundDateOnly?.remindTime ?? null).toBeNull();

      // 4. PATCH /notes/:id đổi giờ nhắc sang 16:45
      const updated = await harness.services.notes.update(created.id, {
        remindTime: '16:45',
      });
      expect(updated.remindTime).toBe('16:45');

      // 5. PATCH /notes/:id xoá remindTime về null
      const cleared = await harness.services.notes.update(created.id, {
        remindTime: null,
      });
      expect(cleared.remindTime ?? null).toBeNull();
    });

    it('từ chối remindTime sai định dạng HH:mm với lỗi 400 validation', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('NoteInvalidRemindTime');

      const createErr = await harness.services.notes
        .create({
          title: 'Ghi chú giờ sai',
          dueDate: '2026-11-15',
          remindTime: '25:99',
        })
        .catch((e: unknown) => e);

      expect(createErr).toBeInstanceOf(ApiError);
      expect((createErr as ApiError).status).toBe(400);
      expect((createErr as ApiError).code).toBe('validation');

      const validNote = await harness.services.notes.create({
        title: 'Ghi chú hợp lệ',
        dueDate: '2026-11-15',
        remindTime: '08:30',
      });

      const patchErr = await harness.services.notes
        .update(validNote.id, {
          remindTime: 'invalid-time',
        })
        .catch((e: unknown) => e);

      expect(patchErr).toBeInstanceOf(ApiError);
      expect((patchErr as ApiError).status).toBe(400);
      expect((patchErr as ApiError).code).toBe('validation');
    });
  });

  // ===========================================================================
  // 2. Dispatch Note Reminders & Dual-Layer In-App Notification Creation
  // ===========================================================================
  describe('US 1, 2, 9, 10, 11, 12, 14: Dispatch Note Reminders tạo InAppNotification + Web Push & Idempotency', () => {
    it('US 9 & 12: Note có dueDate + remindTime đến hạn -> tạo InAppNotification + gửi Web Push + idempotent; đổi remindTime -> nhắc lại ở mốc mới', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('NoteDispatchTimed');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/note-timed-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      const target1 = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const note = await harness.services.notes.create({
        title: 'Chấm bài kiểm tra 15 phút',
        dueDate: target1.date,
        remindTime: target1.time,
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      // Dispatch lần 1: tạo InAppNotification và gửi Web Push
      const d1 = await callDispatch();
      expect(d1.status).toBe(200);
      expect(d1.body.sent).toBeGreaterThanOrEqual(1);

      const matchedPush = receivedPushes.find((p) => p.endpoint === `/sub/${userId}/note-timed-device`);
      expect(matchedPush).toBeDefined();

      // Kiểm tra InAppNotification qua FE notificationService
      const notifList1 = await harness.services.notifications.list();
      expect(notifList1.unreadCount).toBe(1);
      const inApp = notifList1.items.find((n) => n.targetId === note.id);
      expect(inApp).toBeDefined();
      expect(inApp?.type).toBe('note');
      expect(inApp?.title).toContain('Chấm bài kiểm tra 15 phút');
      expect(inApp?.body).toBe(target1.time);
      expect(inApp?.url).toBe(`/notes?noteId=${note.id}`);
      expect(inApp?.readAt).toBeNull();

      // Dispatch lần 2: SentReminder chống trùng lặp -> không tạo thêm InAppNotification hay Push
      receivedPushes.length = 0;
      const d2 = await callDispatch();
      expect(d2.status).toBe(200);
      const notifListAfterDup = await harness.services.notifications.list();
      expect(notifListAfterDup.items.filter((n) => n.targetId === note.id)).toHaveLength(1);
      expect(
        receivedPushes.filter((p) => p.endpoint === `/sub/${userId}/note-timed-device`),
      ).toHaveLength(0);

      // US 12: Giáo viên đổi remindTime (và reminderLeadMinutes = 30) sang mốc mới
      await harness.services.settings.update({ reminderLeadMinutes: 30 });
      const target2 = getDueTargetTime(30, 'Asia/Ho_Chi_Minh', 4);
      await harness.services.notes.update(note.id, {
        dueDate: target2.date,
        remindTime: target2.time,
      });

      const d3 = await callDispatch();
      expect(d3.status).toBe(200);
      expect(d3.body.sent).toBeGreaterThanOrEqual(1);

      const notifListAfterReschedule = await harness.services.notifications.list();
      expect(notifListAfterReschedule.items.filter((n) => n.targetId === note.id)).toHaveLength(2);
    });

    it('US 10: Note chỉ có dueDate (không có remindTime) nhắc đúng lúc 07:00 sáng theo timeZone của giáo viên', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('NoteMorning0700');

      // Tìm timeZone có giờ hiện tại đang nằm trong khoảng 07:00..07:09 sáng
      // hoặc kiểm tra trực tiếp cùng bộ tính toán nếu phút hiện tại vượt ngoài 10 phút đầu giờ
      const now = new Date();
      const utcMinutes = now.getUTCMinutes();
      // Kiểm tra xem có múi giờ chuẩn nào đang ở 07:00..07:09 không
      const candidate7am = findTimeZoneForLocalHourMinute(7, 0, 9);
      const [candHour, candMin] = candidate7am.localTime.split(':').map(Number);

      if (candHour === 7 && candMin >= 0 && candMin <= 9) {
        await harness.services.settings.update({ timeZone: candidate7am.timeZone });

        const morningNote = await harness.services.notes.create({
          title: 'Ghi chú nhắc đầu ngày 07:00',
          dueDate: candidate7am.localDate,
        });

        const dispatchRes = await callDispatch();
        expect(dispatchRes.status).toBe(200);

        const notifs = await harness.services.notifications.list();
        const found = notifs.items.find((n) => n.targetId === morningNote.id);
        expect(found).toBeDefined();
        expect(found?.type).toBe('note');
        expect(found?.body).toBe('07:00');
        expect(found?.url).toBe(`/notes?noteId=${morningNote.id}`);
      } else {
        // Khi phút thực của đồng hồ hệ thống không rơi vào :00..:09 hoặc :30..:39 hoặc :45..:54,
        // Note chỉ có dueDate tạo trên BE vẫn được lưu với remindTime = null và computeNoteRemindAt
        // của FE + BE đều tính chính xác mốc 07:00 sáng theo timeZone của giáo viên.
        await harness.services.settings.update({ timeZone: 'Asia/Ho_Chi_Minh' });
        const morningNote = await harness.services.notes.create({
          title: 'Ghi chú nhắc đầu ngày 07:00',
          dueDate: '2026-10-29',
        });
        expect(morningNote.dueDate).toBe('2026-10-29');
        expect(morningNote.remindTime ?? null).toBeNull();

        const computedRemindAt = computeNoteRemindAt(morningNote, 15, 'Asia/Ho_Chi_Minh');
        expect(computedRemindAt?.toISOString()).toBe('2026-10-29T00:00:00.000Z'); // 07:00 UTC+7 = 00:00 UTC

        // Và tại đúng 07:02 sáng (00:02 UTC), LocalReminderTicker kích hoạt đúng thông báo 07:00:
        const dueItems = evaluateDueReminders({
          tasks: [],
          classSessions: [],
          notes: [morningNote],
          leadMinutes: 15,
          timeZone: 'Asia/Ho_Chi_Minh',
          locale: 'vi',
          now: new Date('2026-10-29T00:01:00.000Z'),
          storage: null,
        });
        expect(dueItems).toHaveLength(1);
        expect(dueItems[0].targetId).toBe(morningNote.id);
        expect(dueItems[0].body).toBe('07:00');
        expect(dueItems[0].url).toBe(`/notes?noteId=${morningNote.id}`);
        expect(utcMinutes).toBeGreaterThanOrEqual(0);
      }

      // Đồng thời xác nhận userId hợp lệ
      expect(userId).toBeDefined();
    });

    it('US 11: Note đã completed = true hoặc đã xoá mềm không phát sinh thông báo khi dispatch', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('NoteSkipCompletedDeleted');

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);

      // Note 1: đã hoàn thành
      const completedNote = await harness.services.notes.create({
        title: 'Ghi chú đã xong',
        dueDate: target.date,
        remindTime: target.time,
        completed: true,
      });

      // Note 2: bị xoá mềm trước khi dispatch
      const deletedNote = await harness.services.notes.create({
        title: 'Ghi chú đã xoá',
        dueDate: target.date,
        remindTime: target.time,
      });
      await harness.services.notes.remove(deletedNote.id);

      await callDispatch();

      const notifs = await harness.services.notifications.list();
      expect(notifs.items.some((n) => n.targetId === completedNote.id)).toBe(false);
      expect(notifs.items.some((n) => n.targetId === deletedNote.id)).toBe(false);
    });

    it('US 1, 2 & 14: Bản ghi InAppNotification luôn được tạo trong DB kể cả khi chưa đăng ký PushSubscription hoặc khi pushEnabled = false', async () => {
      if (!beAvailable) return;

      // Trường hợp 1: Giáo viên chưa đăng ký PushSubscription nào
      const { harness: teacherNoSub } = await createOnboardedTeacher('TeacherNoPushSub');
      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);

      const noteNoSub = await teacherNoSub.services.notes.create({
        title: 'Ghi chú khi chưa có thiết bị Push',
        dueDate: target.date,
        remindTime: target.time,
      });

      // Trường hợp 2: Giáo viên có PushSubscription nhưng tắt pushEnabled = false
      const { harness: teacherPushOff, userId: userPushOffId } =
        await createOnboardedTeacher('TeacherPushOff');
      const offEndpoint = `${PUSH_ENDPOINT_BASE}/sub/${userPushOffId}/off-device`;
      await teacherPushOff.services.push.createPushSubscription({
        endpoint: offEndpoint,
        keys: DUMMY_KEYS_1,
      });
      await teacherPushOff.services.settings.update({ pushEnabled: false });

      const notePushOff = await teacherPushOff.services.notes.create({
        title: 'Ghi chú khi tắt Web Push nhưng vẫn có In-App',
        dueDate: target.date,
        remindTime: target.time,
      });

      receivedPushes.length = 0;

      const dispatchRes = await callDispatch();
      expect(dispatchRes.status).toBe(200);

      // Teacher 1 nhận được InAppNotification dù không có PushSubscription
      const notifsNoSub = await teacherNoSub.services.notifications.list();
      expect(notifsNoSub.unreadCount).toBe(1);
      expect(notifsNoSub.items[0].targetId).toBe(noteNoSub.id);
      expect(notifsNoSub.items[0].type).toBe('note');

      // Teacher 2 nhận được InAppNotification nhưng không bị gửi Web Push tới thiết bị
      const notifsPushOff = await teacherPushOff.services.notifications.list();
      expect(notifsPushOff.unreadCount).toBe(1);
      expect(notifsPushOff.items[0].targetId).toBe(notePushOff.id);

      const pushedToOffDevice = receivedPushes.filter((p) => p.endpoint.includes(offEndpoint.slice(-15)));
      expect(pushedToOffDevice).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 3. Midnight Boundary Fix (23:55 today reminding 00:10 tomorrow with 15m lead)
  // ===========================================================================
  describe('US 13: Sửa lỗi biên qua nửa đêm (00:10 ngày hôm sau với reminderLeadMinutes = 15 bắn lúc 23:55 đêm hôm trước)', () => {
    it('quét đồng thời [yesterday, today, tomorrow] để phát hiện mục lúc 00:10 ngày mai khi đồng hồ đang ở 23:55 hôm nay', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('MidnightBoundaryTeacher');

      // Tìm múi giờ chuẩn mà hiện tại đang là ~23:45..23:59 đêm (để mục lúc 00:05..00:25 ngày mai trừ leadMinutes rơi vào cửa sổ dispatch hiện tại)
      const now = new Date();
      const candidate23h = findTimeZoneForLocalHourMinute(23, 0, 59);
      const [localH, localM] = candidate23h.localTime.split(':').map(Number);

      // Với leadMinutes = 60 (hoặc 30, 15 tùy số phút hiện tại trong giờ 23),
      // nếu localH === 23 và localM >= 32: chọn leadMinutes = 30 -> targetTime ở ngày mai là (localM + 2 - 30) phút sau nửa đêm!
      // Cụ thể: nếu localM = 47, remindAt mong muốn = 23:45 -> với lead = 15, targetTime = 00:00 ngày mai; với lead = 30, targetTime = 00:15 ngày mai!
      let selectedLead: 15 | 30 | 60 = 15;
      if (localM < 15) {
        selectedLead = 60;
      } else if (localM < 45) {
        selectedLead = 30;
      } else {
        selectedLead = 15;
      }

      if (localH === 23 && localM + selectedLead >= 62) {
        await harness.services.settings.update({
          timeZone: candidate23h.timeZone,
          reminderLeadMinutes: selectedLead,
        });

        const targetAfterMidnight = getDueTargetTime(selectedLead, candidate23h.timeZone, 2);
        // targetAfterMidnight.date chính là tomorrowDate (ngày hôm sau theo candidate23h.timeZone)!
        expect(targetAfterMidnight.date).toBe(candidate23h.tomorrowDate);

        const midnightNote = await harness.services.notes.create({
          title: 'Ghi chú qua nửa đêm',
          dueDate: targetAfterMidnight.date,
          remindTime: targetAfterMidnight.time,
        });

        const midnightTask = await harness.services.tasks.create({
          title: 'Công việc qua nửa đêm',
          category: 'school',
          date: targetAfterMidnight.date,
          time: targetAfterMidnight.time,
        });

        const dispatchRes = await callDispatch();
        expect(dispatchRes.status).toBe(200);
        expect(dispatchRes.body.sent).toBeGreaterThanOrEqual(2);

        const notifs = await harness.services.notifications.list();
        expect(notifs.items.some((n) => n.targetId === midnightNote.id)).toBe(true);
        expect(notifs.items.some((n) => n.targetId === midnightTask.id)).toBe(true);
      }

      // Kiểm chứng trực tiếp kịch bản chính xác: 00:10 ngày hôm sau với reminderLeadMinutes = 15 bắn đúng lúc 23:55 đêm hôm trước
      // (2026-10-28 00:10 Asia/Ho_Chi_Minh - 15 phút = 2026-10-27 23:55 Asia/Ho_Chi_Minh = 2026-10-27T16:55:00.000Z)
      const noteAt0010 = await harness.services.notes.create({
        title: 'Soạn đề cương 00:10 sáng mai',
        dueDate: '2026-10-28',
        remindTime: '00:10',
      });
      const taskAt0010 = await harness.services.tasks.create({
        title: 'Khoá sổ điểm 00:10 sáng mai',
        category: 'school',
        date: '2026-10-28',
        time: '00:10',
      });

      const exact2355NightBefore = new Date('2026-10-27T16:55:00.000Z'); // 23:55 local (Asia/Ho_Chi_Minh)
      const dueAt2355 = evaluateDueReminders({
        tasks: [taskAt0010],
        classSessions: [],
        notes: [noteAt0010],
        leadMinutes: 15,
        timeZone: 'Asia/Ho_Chi_Minh',
        locale: 'vi',
        now: exact2355NightBefore,
        storage: null,
      });

      expect(dueAt2355).toHaveLength(2);
      expect(dueAt2355.find((d) => d.type === 'note')?.targetId).toBe(noteAt0010.id);
      expect(dueAt2355.find((d) => d.type === 'note')?.body).toBe('00:10');
      expect(dueAt2355.find((d) => d.type === 'task')?.targetId).toBe(taskAt0010.id);
      expect(dueAt2355.find((d) => d.type === 'task')?.body).toBe('00:10');
      expect(now.getTime()).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 4. In-App Notification Center API (GET /notifications, PATCH /:id/read, POST /read-all, 404 isolation)
  // ===========================================================================
  describe('US 1, 2, 3: FE notificationService ↔ BE /notifications (list, markRead, markAllRead, 404 account isolation)', () => {
    it('liệt kê { items, unreadCount }, lọc unreadOnly/limit, đánh dấu 1 thông báo đã đọc, đánh dấu tất cả đã đọc và trả 404 khi đọc thông báo của giáo viên khác', async () => {
      if (!beAvailable) return;
      const teacherA = await createOnboardedTeacher('NotifCenterA');
      const teacherB = await createOnboardedTeacher('NotifCenterB');

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);

      // Tạo 2 mục đến hạn cho Teacher A (1 Task + 1 Note) và 1 Note đến hạn cho Teacher B
      const taskA = await teacherA.harness.services.tasks.create({
        title: 'Họp tổ chuyên môn A',
        category: 'school',
        date: target.date,
        time: target.time,
      });
      const noteA = await teacherA.harness.services.notes.create({
        title: 'Ghi chú chuẩn bị giáo án A',
        dueDate: target.date,
        remindTime: target.time,
      });
      const noteB = await teacherB.harness.services.notes.create({
        title: 'Ghi chú riêng của giáo viên B',
        dueDate: target.date,
        remindTime: target.time,
      });

      await callDispatch();

      // 1. Teacher A gọi notificationService.list()
      const listA = await teacherA.harness.services.notifications.list();
      expect(listA.unreadCount).toBe(2);
      expect(listA.items).toHaveLength(2);
      expect(listA.items.some((i) => i.targetId === taskA.id && i.type === 'task')).toBe(true);
      expect(listA.items.some((i) => i.targetId === noteA.id && i.type === 'note')).toBe(true);

      // Teacher B có 1 thông báo riêng
      const listB = await teacherB.harness.services.notifications.list();
      expect(listB.unreadCount).toBe(1);
      expect(listB.items).toHaveLength(1);
      const notifBId = listB.items[0].id;
      expect(listB.items[0].targetId).toBe(noteB.id);

      // 2. Teacher A đánh dấu 1 thông báo của mình là đã đọc qua PATCH /notifications/:id/read
      const firstNotifA = listA.items[0];
      const markedOne = await teacherA.harness.services.notifications.markRead(firstNotifA.id);
      expect(markedOne.id).toBe(firstNotifA.id);
      expect(markedOne.readAt).toBeTruthy();

      // 3. Kiểm tra unreadOnly=true chỉ trả về 1 thông báo chưa đọc còn lại của Teacher A
      const unreadListA = await teacherA.harness.services.notifications.list({
        unreadOnly: true,
        limit: 10,
      });
      expect(unreadListA.unreadCount).toBe(1);
      expect(unreadListA.items).toHaveLength(1);
      expect(unreadListA.items[0].id).not.toBe(firstNotifA.id);

      // 4. Kiểm tra cô lập tài khoản: Teacher A cố đọc thông báo của Teacher B -> 404 not_found
      const isolationErr = await teacherA.harness.services.notifications
        .markRead(notifBId)
        .catch((e: unknown) => e);
      expect(isolationErr).toBeInstanceOf(ApiError);
      expect((isolationErr as ApiError).status).toBe(404);
      expect((isolationErr as ApiError).code).toBe('not_found');

      // 5. Teacher A gọi POST /notifications/read-all
      const readAllRes = await teacherA.harness.services.notifications.markAllRead();
      expect(readAllRes).toEqual({ updatedCount: 1 });

      // Sau khi read-all, unreadCount của Teacher A = 0, còn của Teacher B vẫn = 1
      const finalA = await teacherA.harness.services.notifications.list();
      expect(finalA.unreadCount).toBe(0);
      expect(finalA.items.every((i) => i.readAt !== null)).toBe(true);

      const finalB = await teacherB.harness.services.notifications.list();
      expect(finalB.unreadCount).toBe(1);
    });
  });

  // ===========================================================================
  // 5. Send Test Notification (FE pushService.sendTestNotification() ↔ BE POST /push/subscriptions/test)
  // ===========================================================================
  describe('US 8: FE pushService.sendTestNotification() ↔ BE POST /push/subscriptions/test', () => {
    it('tạo 1 thông báo thử In-App (type = system) và gửi gói tin Web Push thử nghiệm tới thiết bị đã đăng ký ({ sent, failed, inAppCreated: true })', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('TestPushTeacher');

      // 1. Gọi sendTestNotification khi chưa có thiết bị PushSubscription -> vẫn tạo In-App Notification
      const resWithoutSub = await harness.services.push.sendTestNotification();
      expect(resWithoutSub).toEqual({
        sent: 0,
        failed: 0,
        inAppCreated: true,
      });

      const listAfterFirstTest = await harness.services.notifications.list();
      expect(listAfterFirstTest.unreadCount).toBe(1);
      expect(listAfterFirstTest.items[0].type).toBe('system');
      expect(listAfterFirstTest.items[0].title).toContain('CuteTeachy');

      // 2. Đăng ký thiết bị Web Push và gọi lại sendTestNotification
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/test-push-device`;
      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      const resWithSub = await harness.services.push.sendTestNotification();
      expect(resWithSub).toEqual({
        sent: 1,
        failed: 0,
        inAppCreated: true,
      });

      // Xác nhận mock push server đã nhận được gói tin Web Push
      const testPushReceived = receivedPushes.find(
        (p) => p.endpoint === `/sub/${userId}/test-push-device`,
      );
      expect(testPushReceived).toBeDefined();

      // Xác nhận Notification Center có 2 thông báo hệ thống
      const listAfterSecondTest = await harness.services.notifications.list();
      expect(listAfterSecondTest.unreadCount).toBe(2);
      expect(listAfterSecondTest.items[0].type).toBe('system');
    });
  });

  // ===========================================================================
  // 6. Đồng bộ FE LocalReminderTicker, Service Worker Tag Deduplication & iOS/Android Flow
  // ===========================================================================
  describe('US 4, 5, 6, 7: Đồng bộ LocalReminderTicker, Service Worker Tag & Nhận diện iOS/Android', () => {
    it('LocalReminderTicker tính toán thời điểm nhắc khớp với dữ liệu từ BE, chống trùng qua storage và dùng chung Notification.tag với Service Worker', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('TickerSyncTeacher');

      const note = await harness.services.notes.create({
        title: 'Ghi chú kiểm tra Ticker',
        dueDate: '2026-11-20',
        remindTime: '09:00',
      });

      // Mốc nhắc: 2026-11-20 09:00 (UTC+7) - 15m = 08:45 (UTC+7) = 01:45 UTC
      const remindAtUtc = new Date('2026-11-20T01:45:00.000Z');
      const nowInsideWindow = new Date('2026-11-20T01:45:30.000Z');

      const memoryStore = new Map<string, string>();
      const storage: MinimalStorage = {
        getItem: (k) => memoryStore.get(k) ?? null,
        setItem: (k, v) => {
          memoryStore.set(k, v);
        },
      };

      let invalidated = 0;
      const shownNotifications: Array<{ title: string; options?: NotificationOptions }> = [];

      // Lần tick 1: phát hiện Note đến hạn, gọi invalidateNotifications và showNotification với tag chuẩn
      const due1 = await runReminderTick({
        tasks: [],
        classSessions: [],
        notes: [note],
        leadMinutes: 15,
        timeZone: 'Asia/Ho_Chi_Minh',
        locale: 'vi',
        now: nowInsideWindow,
        storage,
        invalidateNotifications: () => {
          invalidated += 1;
        },
        notificationPermission: 'granted',
        visibilityState: 'hidden',
        serviceWorkerReady: Promise.resolve({
          showNotification: async (title: string, options?: NotificationOptions) => {
            shownNotifications.push({ title, options });
          },
        }),
      });

      const expectedTag = buildReminderTag('note', note.id, remindAtUtc.getTime());
      expect(due1).toHaveLength(1);
      expect(due1[0].tag).toBe(expectedTag);
      expect(due1[0].url).toBe(`/notes?noteId=${note.id}`);
      expect(invalidated).toBe(1);
      expect(shownNotifications).toHaveLength(1);
      expect(shownNotifications[0].options?.tag).toBe(expectedTag);

      // Service Worker formatPushNotification khi nhận cùng explicitTag sẽ giữ nguyên tag để OS deduplicate
      const swFormatted = formatPushNotification({
        type: 'note',
        id: note.id,
        title: due1[0].title,
        body: due1[0].body,
        url: due1[0].url,
        tag: expectedTag,
      });
      expect(swFormatted.tag).toBe(expectedTag);
      expect(swFormatted.url).toBe(`/notes?noteId=${note.id}`);

      // Lần tick 2 trong cùng cửa sổ: không báo lặp lại
      const due2 = await runReminderTick({
        tasks: [],
        classSessions: [],
        notes: [note],
        leadMinutes: 15,
        timeZone: 'Asia/Ho_Chi_Minh',
        locale: 'vi',
        now: new Date('2026-11-20T01:46:00.000Z'),
        storage,
      });
      expect(due2).toHaveLength(0);

      // Nhận diện mọi trình duyệt trên iOS (Safari, Chrome CriOS, Firefox FxiOS, iPadOS)
      expect(
        isIosDevice(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1',
        ),
      ).toBe(true);
      expect(
        isIosDevice(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15',
        ),
      ).toBe(true);
      expect(
        evaluatePushDecision({
          isSupported: false,
          isIos: true,
          isStandalone: false,
          permission: 'default',
        }),
      ).toBe('ios_needs_pwa');
      expect(
        evaluatePushDecision({
          isSupported: true,
          isIos: true,
          isStandalone: true,
          permission: 'default',
        }),
      ).toBe('can_prompt');
    });
  });
});
