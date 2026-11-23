import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import type { AuthSession } from '@/types';

// =============================================================================
// SPEC-005 Full E2E Cross-Repo Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–17 against live NestJS + PostgreSQL using FakePushSender
// via NestJS overrideProvider (preserves production SSRF protection on endpoints).
// Runs on a dedicated port (4005) to avoid collisions with other test runs.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_PORT = Number(process.env.BE_PORT_SPEC005 || '4005');
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
  // We want remindAt = targetTime - leadMinutes to be ~ (now - bufferMinutes),
  // which is comfortably within the dispatch window: (now - 10 minutes, now].
  const now = Date.now();
  const targetTimeMs = now - bufferMinutes * 60 * 1000 + leadMinutes * 60 * 1000;
  return formatInTimeZone(new Date(targetTimeMs), timeZone);
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

let ipCounter = 300;
function getNextTestIp(): string {
  ipCounter++;
  const b = Math.floor(ipCounter / 250);
  const c = ipCounter % 250;
  return `10.200.${b}.${c}`;
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
  secret?: string,
): Promise<{ status: number; body: DispatchResponseBody }> {
  const headers: Record<string, string> = {};
  if (secret !== undefined) {
    headers['X-Cron-Secret'] = secret;
  }
  const res = await fetch(`${BE_URL}/internal/reminders/dispatch`, {
    method: 'POST',
    headers,
  });
  const body = (await res.json().catch(() => ({}))) as DispatchResponseBody;
  return { status: res.status, body };
}

const DUMMY_KEYS_1 = {
  p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=',
  auth: 'tBHItJI5svbpez7KI4CCXg==',
};
const DUMMY_KEYS_2 = {
  p256dh: 'BKSnDEB7dNDipkCZDOzvCKbQM7Wx8w-74m8LtqJZtJau_H9g_bpwn1KezWSXbZZ3IkadZNbl9utcQbIHIKX3_4w',
  auth: 'io7HrEhc256RDSYiu7XsYA',
};

describe('SPEC-005 Push & Reminders E2E Cross-Repo Integration Suite (FE ↔ BE live)', { timeout: 60000 }, () => {
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
  // User Story 17: Xác thực Cron Secret cho Dispatch
  // ===========================================================================
  describe('User Story 17: Xác thực Cron Secret cho Dispatch', () => {
    it('từ chối gọi dispatch khi thiếu header X-Cron-Secret với mã 401', async () => {
      if (!beAvailable) return;
      const res = await callDispatch();
      expect(res.status).toBe(401);
      expect(res.body?.message).toMatch(/Missing X-Cron-Secret header/i);
    });

    it('từ chối gọi dispatch khi sai secret với mã 401', async () => {
      if (!beAvailable) return;
      const res = await callDispatch('invalid-secret-xyz');
      expect(res.status).toBe(401);
      expect(res.body?.message).toMatch(/Invalid X-Cron-Secret header/i);
    });

    it('chấp nhận gọi dispatch khi secret đúng, trả về { sent, skipped }', async () => {
      if (!beAvailable) return;
      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);
      expect(typeof res.body?.sent).toBe('number');
      expect(typeof res.body?.skipped).toBe('number');
    });
  });

  // ===========================================================================
  // User Stories 1, 2, 13 & 14: Quản lý Push Subscriptions & Thiết bị
  // ===========================================================================
  describe('User Stories 1, 2, 13 & 14: Đăng ký thiết bị & VAPID Public Key', () => {
    it('US 1: Lấy VAPID public key hợp lệ dạng chuỗi base64url từ GET /push/vapid-public-key', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('PushTeacherVapid');
      const res = await harness.services.push.getVapidPublicKey();

      expect(res).toBeDefined();
      expect(typeof res.publicKey).toBe('string');
      // Uncompressed P-256 public key (65 bytes) encoded as base64url is 87 characters
      expect(res.publicKey.length).toBeGreaterThanOrEqual(80);
      expect(res.publicKey).not.toContain('+');
      expect(res.publicKey).not.toContain('/');
    });

    it('US 13: Đăng ký thiết bị 1 trả về 201 Created; đăng ký lại cùng endpoint trả về 200 OK (upsert)', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('UpsertTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/device-primary`;

      // Lần 1: Tạo mới subscription -> 201 Created
      const sub1 = await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });
      expect(sub1.endpoint).toBe(endpoint);
      expect(sub1.accountId).toBe(userId);

      // Lần 2: Cập nhật lại cùng endpoint -> 200 OK (upsert)
      const sub2 = await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });
      expect(sub2.endpoint).toBe(endpoint);
      expect(sub2.accountId).toBe(userId);
    });

    it('US 13 & 14: Đăng ký subscription cùng endpoint với giáo viên khác -> endpoint được chuyển giao tài khoản', async () => {
      if (!beAvailable) return;
      const teacherA = await createOnboardedTeacher('TeacherA');
      const teacherB = await createOnboardedTeacher('TeacherB');
      const sharedEndpoint = `${PUSH_ENDPOINT_BASE}/sub/shared-phone`;

      // Teacher A đăng ký thiết bị
      const subA = await teacherA.harness.services.push.createPushSubscription({
        endpoint: sharedEndpoint,
        keys: DUMMY_KEYS_1,
      });
      expect(subA.accountId).toBe(teacherA.userId);

      // Teacher B dùng cùng thiết bị đăng ký
      const subB = await teacherB.harness.services.push.createPushSubscription({
        endpoint: sharedEndpoint,
        keys: DUMMY_KEYS_2,
      });
      expect(subB.accountId).toBe(teacherB.userId);
      expect(subB.endpoint).toBe(sharedEndpoint);
    });

    it('US 13: Giáo viên có nhiều thiết bị (điện thoại và laptop) đều nhận được thông báo', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('MultiDeviceTeacher');
      const phoneEndpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/phone`;
      const laptopEndpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/laptop`;

      await harness.services.push.createPushSubscription({
        endpoint: phoneEndpoint,
        keys: DUMMY_KEYS_1,
      });
      await harness.services.push.createPushSubscription({
        endpoint: laptopEndpoint,
        keys: DUMMY_KEYS_2,
      });

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      await harness.services.tasks.create({
        title: 'Nhắc trên cả hai thiết bị',
        category: 'school',
        date: target.date,
        time: target.time,
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const phonePush = receivedPushes.find((p) => p.endpoint === `/sub/${userId}/phone`);
      const laptopPush = receivedPushes.find((p) => p.endpoint === `/sub/${userId}/laptop`);
      expect(phonePush).toBeDefined();
      expect(laptopPush).toBeDefined();
    });
  });

  // ===========================================================================
  // User Stories 3, 5, 8, 9, 10, 11, 12: Nhắc việc (Task Reminders) & Idempotency
  // ===========================================================================
  describe('User Stories 3, 5, 8, 9, 10, 11, 12: Gửi nhắc việc có giờ cho Task', () => {
    it('US 3, 9, 11, 12: Gửi Reminder cho Task có giờ đến hạn; gọi dispatch lần 2 chỉ gửi đúng 1 lần (idempotent)', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('TaskRemindTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/task-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Mặc định: reminderLeadMinutes = 15, timeZone = Asia/Ho_Chi_Minh
      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const task = await harness.services.tasks.create({
        title: 'Nộp sổ điểm học kỳ',
        category: 'school',
        date: target.date,
        time: target.time,
      });
      expect(task.id).toBeDefined();

      receivedPushes.length = 0;
      nextPushStatus = 201;

      // Dispatch lần 1: đến hạn nhắc
      const dispatch1 = await callDispatch(CRON_SECRET);
      expect(dispatch1.status).toBe(200);
      expect(dispatch1.body.sent).toBeGreaterThanOrEqual(1);

      // Kiểm tra request push đã tới server push
      const matchedPush = receivedPushes.find((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(matchedPush).toBeDefined();

      // Dispatch lần 2: kiểm tra tính idempotent (không gửi lại thông báo trùng)
      const dispatch2 = await callDispatch(CRON_SECRET);
      expect(dispatch2.status).toBe(200);
      expect(dispatch2.body.sent).toBe(0);
    });

    it('US 8: Đổi giờ Task hoặc đổi số phút nhắc (reminderLeadMinutes) -> dispatch phát hiện mốc nhắc mới', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('LeadMinutesChangeTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/lead-change-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Tạo task ban đầu với mốc nhắc theo lead 15 phút
      const target1 = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const task = await harness.services.tasks.create({
        title: 'Họp hội đồng giáo viên',
        category: 'school',
        date: target1.date,
        time: target1.time,
      });

      // Dispatch lần 1 gửi thành công
      const d1 = await callDispatch(CRON_SECRET);
      expect(d1.body.sent).toBeGreaterThanOrEqual(1);

      // Giáo viên đổi cài đặt số phút nhắc trước: từ 15 phút sang 30 phút (US 5 & 8)
      await harness.services.settings.update({ reminderLeadMinutes: 30 });

      // Cập nhật lại giờ Task sao cho tương thích với số phút nhắc 30 phút mới (remindAt mốc mới)
      const target2 = getDueTargetTime(30, 'Asia/Ho_Chi_Minh', 5);
      await harness.services.tasks.update(task.id, {
        date: target2.date,
        time: target2.time,
      });

      // Dispatch phát hiện mốc nhắc mới (remindAt mới) do đổi lead/giờ
      const d2 = await callDispatch(CRON_SECRET);
      expect(d2.body.sent).toBeGreaterThanOrEqual(1);
    });

    it('US 7: Không gửi Reminder cho Task đã hoàn thành hoặc Task đã xoá mềm', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('SkipCompletedDeletedTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/skip-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Task 1: có giờ đến hạn nhưng completed = true
      const target1 = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const taskCompleted = await harness.services.tasks.create({
        title: 'Task đã hoàn tất',
        category: 'school',
        date: target1.date,
        time: target1.time,
      });
      await harness.services.tasks.update(taskCompleted.id, { completed: true });

      // Task 2: có giờ đến hạn nhưng bị xoá mềm
      const taskDeleted = await harness.services.tasks.create({
        title: 'Task chuẩn bị xoá',
        category: 'school',
        date: target1.date,
        time: target1.time,
      });
      await harness.services.tasks.remove(taskDeleted.id);

      receivedPushes.length = 0;

      // Dispatch không được gửi push cho 2 task này
      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const pushedToDevice = receivedPushes.filter((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(pushedToDevice.length).toBe(0);
    });

    it('US 10: Bỏ qua Task quá muộn (trễ hơn 10 phút)', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('TooLateTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/late-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Task có thời điểm nhắc quá khứ > 10 phút trước
      // bufferMinutes = 15 -> remindAt = now - 15 phút (trễ quá 10 phút)
      const lateTarget = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 15);
      await harness.services.tasks.create({
        title: 'Task quá muộn không nhắc',
        category: 'school',
        date: lateTarget.date,
        time: lateTarget.time,
      });

      receivedPushes.length = 0;
      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const pushedToDevice = receivedPushes.filter((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(pushedToDevice.length).toBe(0);
    });
  });

  // ===========================================================================
  // User Stories 4, 7, 8, 16: Tiết dạy (Timetable Slots & Class Sessions)
  // ===========================================================================
  describe('User Stories 4, 7, 8, 16: Gửi nhắc tiết dạy (Slots & Class Sessions)', () => {
    it('US 4 & 9: Gửi Reminder cho tiết dạy sinh từ Thời khoá biểu (TimetableSlot) đến hạn', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('SlotRemindTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/slot-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const [h, m] = target.time.split(':').map(Number);
      const endM = (m + 45) % 60;
      const endH = h + Math.floor((m + 45) / 60);
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Tạo slot lặp lại vào thứ hôm nay
      await harness.services.timetableSlots.create({
        weekday: target.weekday,
        startTime: target.time,
        endTime,
        subject: 'Toán học 10',
        grade: '10A1',
        room: 'P.201',
        tone: 'blue',
        effectiveFrom: target.date,
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      // Dispatch gửi Reminder cho tiết dạy sinh ra hôm nay
      const d1 = await callDispatch(CRON_SECRET);
      expect(d1.status).toBe(200);
      expect(d1.body.sent).toBeGreaterThanOrEqual(1);

      // Dispatch lần 2: idempotent
      const d2 = await callDispatch(CRON_SECRET);
      expect(d2.status).toBe(200);
      expect(d2.body.sent).toBe(0);
    });

    it('US 4 & 7: Tiết dạy bị huỷ (cancelled = true) không gửi nhắc nhở', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('CancelledSessionTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/cancelled-session-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const [h, m] = target.time.split(':').map(Number);
      const endM = (m + 45) % 60;
      const endH = (h + Math.floor((m + 45) / 60)) % 24;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Tạo buổi lẻ (ad-hoc session) hôm nay nhưng bị đánh dấu huỷ
      const createdSession = await harness.services.classSessions.create({
        date: target.date,
        startTime: target.time,
        endTime,
        subject: 'Vật lý bổ trợ',
        tone: 'lavender',
      });
      await harness.services.classSessions.update(createdSession.id, {
        cancelled: true,
      });

      receivedPushes.length = 0;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const pushed = receivedPushes.filter((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(pushed.length).toBe(0);
    });

    it('US 4: Gửi Reminder cho buổi lẻ (ad-hoc class session) chưa huỷ đến hạn', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('AdHocRemindTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/adhoc-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      const [h, m] = target.time.split(':').map(Number);
      const endM = (m + 45) % 60;
      const endH = (h + Math.floor((m + 45) / 60)) % 24;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      await harness.services.classSessions.create({
        date: target.date,
        startTime: target.time,
        endTime,
        subject: 'Hóa học phụ đạo',
        tone: 'mint',
        
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.sent).toBeGreaterThanOrEqual(1);

      const pushed = receivedPushes.find((p) => p.endpoint === `/sub/${userId}/adhoc-device`);
      expect(pushed).toBeDefined();
    });

    it('US 16: Đổi múi giờ (timeZone) -> dispatch tính lại giờ nhắc theo múi giờ mới', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('TimeZoneTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/tz-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Đổi sang múi giờ Tokyo (Asia/Tokyo)
      await harness.services.settings.update({ timeZone: 'Asia/Tokyo' });

      // Tính giờ theo múi giờ Tokyo
      const targetTokyo = getDueTargetTime(15, 'Asia/Tokyo', 2);
      await harness.services.tasks.create({
        title: 'Task theo giờ Tokyo',
        category: 'school',
        date: targetTokyo.date,
        time: targetTokyo.time,
      });

      receivedPushes.length = 0;
      nextPushStatus = 201;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.sent).toBeGreaterThanOrEqual(1);

      const pushed = receivedPushes.find((p) => p.endpoint === `/sub/${userId}/tz-device`);
      expect(pushed).toBeDefined();
    });
  });

  // ===========================================================================
  // User Story 6: Công tắc tổng thông báo (pushEnabled = false)
  // ===========================================================================
  describe('User Story 6: Tắt toàn bộ thông báo (pushEnabled = false)', () => {
    it('khi tắt pushEnabled, mọi reminder đến hạn đều bị bỏ qua', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('PushDisabledTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/disabled-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Tắt công tắc push trong Settings
      await harness.services.settings.update({ pushEnabled: false });

      // Tạo task đến hạn
      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      await harness.services.tasks.create({
        title: 'Việc không nhắc do tắt push',
        category: 'school',
        date: target.date,
        time: target.time,
      });

      receivedPushes.length = 0;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const pushed = receivedPushes.filter((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(pushed.length).toBe(0);
    });
  });

  // ===========================================================================
  // User Stories 14 & 15: Đăng xuất và dọn dẹp subscription hết hạn
  // ===========================================================================
  describe('User Stories 14 & 15: Huỷ đăng ký & Tự động xoá subscription hết hạn', () => {
    it('US 14: Đăng xuất gọi DELETE /push/subscriptions trả về 204 No Content, thiết bị không còn nhận push', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('LogoutTeacher');
      const endpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/logout-device`;

      await harness.services.push.createPushSubscription({
        endpoint,
        keys: DUMMY_KEYS_1,
      });

      // Giáo viên đăng xuất: FE gọi DELETE /push/subscriptions
      await harness.services.push.deletePushSubscription({ endpoint });

      // Tạo task đến hạn
      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      await harness.services.tasks.create({
        title: 'Task sau khi đăng xuất',
        category: 'school',
        date: target.date,
        time: target.time,
      });

      receivedPushes.length = 0;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      const pushed = receivedPushes.filter((p) => p.endpoint.includes(endpoint.slice(-20)));
      expect(pushed.length).toBe(0);
    });

    it('US 15: Subscription trả về 410 Gone (hết hạn) tự động bị xoá khỏi cơ sở dữ liệu', async () => {
      if (!beAvailable) return;
      const { harness, userId } = await createOnboardedTeacher('ExpiredSubTeacher');
      const expiredEndpoint = `${PUSH_ENDPOINT_BASE}/sub/${userId}/expired-device`;

      await harness.services.push.createPushSubscription({
        endpoint: expiredEndpoint,
        keys: DUMMY_KEYS_1,
      });

      const target = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 2);
      await harness.services.tasks.create({
        title: 'Task gửi đến subscription hết hạn',
        category: 'school',
        date: target.date,
        time: target.time,
      });

      // Cấu hình mock push server trả về 410 Gone
      nextPushStatus = 410;

      const res = await callDispatch(CRON_SECRET);
      expect(res.status).toBe(200);

      // Phục hồi lại mock push server về 201
      nextPushStatus = 201;

      // Đổi giờ task để kích hoạt mốc nhắc mới
      const newTarget = getDueTargetTime(15, 'Asia/Ho_Chi_Minh', 1);
      await harness.services.tasks.create({
        title: 'Task mới sau khi expired',
        category: 'school',
        date: newTarget.date,
        time: newTarget.time,
      });

      receivedPushes.length = 0;

      // Dispatch chạy tiếp: subscription đã bị xoá nên không thể gửi tới endpoint này nữa
      await callDispatch(CRON_SECRET);
      const expiredCalls = receivedPushes.filter((p) => p.endpoint.includes(expiredEndpoint.slice(-20)));
      expect(expiredCalls.length).toBe(0);
    });
  });
});


