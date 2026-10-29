import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import { ApiError } from '@/lib/api/api-error';
import {
  buildApplyDraftPayload,
  submitAiScheduleDraft,
  updateDraftItemField,
} from '@/features/ai-assistant/components/AiScheduleDraftCard';
import { validateAiImageFile } from '@/features/ai-assistant/components/AiAssistantView';
import { formatClassSessionReminderNotification } from '@/utils';
import { evaluateDueReminders } from '@/features/notifications/utils/local-reminder-ticker';
import type {
  AiScheduleDraftItem,
  AuthSession,
  ScheduleCategory,
} from '@/types';

// =============================================================================
// SPEC-007 Full E2E Cross-Repo Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–12 from SPEC-007 against live NestJS + PostgreSQL
// using FakeAiAssistant, FakeObjectStorage, FakePushSender, and FixedClock via
// NestJS overrideProvider.
// Runs on a dedicated port (4007) to avoid collisions with other test runs.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_PORT = Number(process.env.BE_PORT_SPEC007 || '4007');
const BE_URL = `http://localhost:${BE_PORT}`;
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret-token';

const beRequire = createRequire(path.join(BE_DIR, 'package.json'));

interface BeGenerateAiReplyInput {
  message?: string;
  image?: {
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: {
    today: string;
    weekday: number;
    timeZone: string;
    locale: string;
    windowFrom: string;
    windowTo: string;
    standardPeriodTimes: ReadonlyArray<{
      period: number;
      session: 'morning' | 'afternoon';
      periodInSession: number;
      startTime: string;
      endTime: string;
    }>;
    timetableSlots: Array<{
      id: string;
      weekday: number;
      startTime: string;
      endTime: string;
      subject: string;
      grade?: string | null;
      room?: string | null;
      category: ScheduleCategory;
      effectiveFrom: string;
      effectiveTo?: string | null;
    }>;
    classSessions: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      subject: string;
      grade?: string | null;
      room?: string | null;
      category: ScheduleCategory;
      topic?: string | null;
      cancelled: boolean;
      isAdHoc: boolean;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      date: string;
      time?: string | null;
      category: string;
      priority: string;
      completed: boolean;
      notes?: string | null;
    }>;
    notes: Array<{
      id: string;
      title: string;
      content?: string | null;
      dueDate?: string | null;
      remindTime?: string | null;
      completed: boolean;
    }>;
  };
}

interface BeGenerateAiReplyOutput {
  reply: string;
  draftItems?: AiScheduleDraftItem[];
}

class FakeAiAssistant {
  public readonly calls: BeGenerateAiReplyInput[] = [];
  private nextReply: BeGenerateAiReplyOutput = {
    reply: 'Xin chào thầy/cô! Tôi có thể giúp gì cho lịch trình hôm nay?',
  };
  private handler:
    | ((input: BeGenerateAiReplyInput) => Promise<BeGenerateAiReplyOutput> | BeGenerateAiReplyOutput)
    | null = null;

  setNextReply(output: BeGenerateAiReplyOutput): void {
    this.nextReply = output;
    this.handler = null;
  }

  setHandler(
    fn: (input: BeGenerateAiReplyInput) => Promise<BeGenerateAiReplyOutput> | BeGenerateAiReplyOutput,
  ): void {
    this.handler = fn;
  }

  async generateReply(input: BeGenerateAiReplyInput): Promise<BeGenerateAiReplyOutput> {
    this.calls.push(input);
    if (this.handler) {
      return this.handler(input);
    }
    return {
      reply: this.nextReply.reply,
      draftItems: this.nextReply.draftItems
        ? this.nextReply.draftItems.map((item) => ({ ...item }))
        : undefined,
    };
  }

  clear(): void {
    this.calls.length = 0;
    this.handler = null;
  }
}

interface PutObjectOptions {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}

class FakeObjectStorage {
  private readonly storage = new Map<string, { body: Buffer; contentType: string }>();
  public readonly putCalls: PutObjectOptions[] = [];
  public readonly deleteCalls: { bucket: string; key: string }[] = [];

  constructor(private readonly publicBaseUrl = 'http://localhost:9000/avatars') {}

  async putObject(options: PutObjectOptions): Promise<void> {
    this.putCalls.push({ ...options });
    const storageKey = `${options.bucket}/${options.key}`;
    this.storage.set(storageKey, {
      body: options.body,
      contentType: options.contentType,
    });
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    this.deleteCalls.push({ bucket, key });
    const storageKey = `${bucket}/${key}`;
    this.storage.delete(storageKey);
  }

  getPublicUrl(bucket: string, key: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/, '');
    if (base.endsWith(`/${bucket}`)) {
      return `${base}/${key}`;
    }
    return `${base}/${key}`;
  }

  hasObject(bucket: string, key: string): boolean {
    return this.storage.has(`${bucket}/${key}`);
  }

  clear(): void {
    this.storage.clear();
    this.putCalls.length = 0;
    this.deleteCalls.length = 0;
  }
}

interface SentPushRecord {
  target: { endpoint: string; p256dh: string; auth: string };
  payload: {
    title: string;
    body: string;
    url: string;
    data?: Record<string, unknown>;
  };
}

class FakePushSender {
  private readonly sentRecords: SentPushRecord[] = [];

  getVapidPublicKey(): string {
    return 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM';
  }

  async send(
    target: { endpoint: string; p256dh: string; auth: string },
    payload: SentPushRecord['payload'],
  ): Promise<void> {
    this.sentRecords.push({ target, payload });
  }

  getSentMessages(): SentPushRecord[] {
    return [...this.sentRecords];
  }

  clear(): void {
    this.sentRecords.length = 0;
  }
}

class FixedClock {
  constructor(private at: Date) {}

  now(): Date {
    return this.at;
  }

  set(at: Date): void {
    this.at = at;
  }

  advance(ms: number): void {
    this.at = new Date(this.at.getTime() + ms);
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

let ipCounter = 700;
function getNextTestIp(): string {
  ipCounter++;
  const b = Math.floor(ipCounter / 250);
  const c = ipCounter % 250;
  return `10.207.${b}.${c}`;
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

const VALID_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const DUMMY_PUSH_KEYS = {
  p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=',
  auth: 'tBHItJI5svbpez7KI4CCXg==',
};

interface NestAppHandle {
  listen(port: number | string): Promise<unknown>;
  close(): Promise<void>;
}

describe(
  'SPEC-007 Schedule Categories & Multimodal AI Assistant Cross-Repo Integration Suite (FE ↔ BE live)',
  { timeout: 60000 },
  () => {
    let app: NestAppHandle | null = null;
    let fakeAi: FakeAiAssistant;
    let fakeStorage: FakeObjectStorage;
    let fakePushSender: FakePushSender;
    let clock: FixedClock;

    // 2026-10-29 (Thursday, weekday = 4) 09:45 Asia/Ho_Chi_Minh = 2026-10-29T02:45:00.000Z
    // With 15m lead, sessions/tasks starting at 10:00 on 2026-10-29 have remindAt = 02:45:00.000Z
    const baseFixedNow = new Date('2026-10-29T02:45:00.000Z');

    beforeAll(async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';

      const { Test } = beRequire('@nestjs/testing');
      const { AppModule } = beRequire(path.join(BE_DIR, 'dist/src/composition/app.module'));
      const { setupApp } = beRequire(path.join(BE_DIR, 'dist/src/setup-app'));
      const { AI_ASSISTANT_PORT } = beRequire(
        path.join(BE_DIR, 'dist/src/application/ai-assistant/ports/ai-assistant.port'),
      );
      const { OBJECT_STORAGE } = beRequire(
        path.join(BE_DIR, 'dist/src/application/avatar/ports/object-storage.port'),
      );
      const { PUSH_SENDER } = beRequire(
        path.join(BE_DIR, 'dist/src/application/push-subscription/ports/push-sender.port'),
      );
      const { CLOCK } = beRequire(
        path.join(BE_DIR, 'dist/src/application/shared/ports/clock.port'),
      );

      fakeAi = new FakeAiAssistant();
      fakeStorage = new FakeObjectStorage('http://localhost:9000/avatars');
      fakePushSender = new FakePushSender();
      clock = new FixedClock(baseFixedNow);

      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(AI_ASSISTANT_PORT)
        .useValue(fakeAi)
        .overrideProvider(OBJECT_STORAGE)
        .useValue(fakeStorage)
        .overrideProvider(PUSH_SENDER)
        .useValue(fakePushSender)
        .overrideProvider(CLOCK)
        .useValue(clock)
        .compile();

      app = moduleFixture.createNestApplication();
      setupApp(app);
      await app!.listen(BE_PORT);
    }, 60000);

    beforeEach(() => {
      fakeAi.clear();
      fakeStorage.clear();
      fakePushSender.clear();
      clock.set(baseFixedNow);
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    // =========================================================================
    // 1. 3 Loại lịch (ScheduleCategory): school_teaching, extra_teaching, self_study
    // =========================================================================
    describe('US 1, 2, 3, 4: 3 Loại lịch (ScheduleCategory) trên TimetableSlot, ClassSession & Reminder Dispatch', () => {
      it('tạo, sửa, đọc TimetableSlot và ClassSession với cả 3 loại school_teaching, extra_teaching, self_study qua FE services ↔ BE API', async () => {
        const { harness } = await createOnboardedTeacher('SchedCatCrud');

        // 1. Tạo TimetableSlot không truyền category -> mặc định school_teaching
        const defaultSlot = await harness.services.timetableSlots.create({
          weekday: 1,
          startTime: '07:00',
          endTime: '07:45',
          subject: 'Toán Đại số 10A',
          grade: '10A',
          room: 'P.101',
          tone: 'blue',
          effectiveFrom: '2026-10-26',
        });
        expect(defaultSlot.category).toBe('school_teaching');

        // 2. Tạo TimetableSlot với category = extra_teaching
        const extraSlot = await harness.services.timetableSlots.create({
          weekday: 2,
          startTime: '18:00',
          endTime: '19:30',
          subject: 'Bồi dưỡng Toán 9A',
          grade: '9A',
          room: 'Cơ sở 2',
          tone: 'mint',
          category: 'extra_teaching',
          effectiveFrom: '2026-10-26',
        });
        expect(extraSlot.category).toBe('extra_teaching');

        // 3. Tạo TimetableSlot với category = self_study (tương lai >= today để sửa in-place)
        const studySlot = await harness.services.timetableSlots.create({
          weekday: 3,
          startTime: '20:00',
          endTime: '21:30',
          subject: 'Luyện thi IELTS 7.5',
          room: 'Online Zoom',
          tone: 'lavender',
          category: 'self_study',
          effectiveFrom: '2026-10-30',
        });
        expect(studySlot.category).toBe('self_study');

        // 4. Sửa category của studySlot từ self_study -> extra_teaching
        const patchedStudy = await harness.services.timetableSlots.update(studySlot.id, {
          category: 'extra_teaching',
        });
        expect(patchedStudy.current.category).toBe('extra_teaching');

        // Sửa lại về self_study
        const revertedStudy = await harness.services.timetableSlots.update(studySlot.id, {
          category: 'self_study',
        });
        expect(revertedStudy.current.category).toBe('self_study');

        // 5. GET /timetable-slots trả về đúng category của cả 3 slot
        const slotList = await harness.services.timetableSlots.list();
        expect(slotList.items.find((s) => s.id === defaultSlot.id)?.category).toBe(
          'school_teaching',
        );
        expect(slotList.items.find((s) => s.id === extraSlot.id)?.category).toBe(
          'extra_teaching',
        );
        expect(slotList.items.find((s) => s.id === studySlot.id)?.category).toBe('self_study');

        // 6. Tạo Ad-hoc ClassSession với cả 3 loại lịch
        const adhocSchool = await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '08:00',
          endTime: '08:45',
          subject: 'Dạy thay Sinh học 10B',
          grade: '10B',
          tone: 'pink',
          category: 'school_teaching',
        });
        const adhocExtra = await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '17:30',
          endTime: '19:00',
          subject: 'Phụ đạo Hóa 11',
          grade: '11A',
          tone: 'mint',
          category: 'extra_teaching',
        });
        const adhocStudy = await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '20:00',
          endTime: '21:30',
          subject: 'Học Cao học Lý luận dạy học',
          tone: 'lavender',
          category: 'self_study',
        });

        expect(adhocSchool.category).toBe('school_teaching');
        expect(adhocExtra.category).toBe('extra_teaching');
        expect(adhocStudy.category).toBe('self_study');

        // Cập nhật category của ad-hoc session
        const updatedAdhoc = await harness.services.classSessions.update(adhocSchool.id, {
          category: 'extra_teaching',
        });
        expect(updatedAdhoc.category).toBe('extra_teaching');
      });

      it('ClassSession sinh từ TimetableSlot kế thừa đúng category, hỗ trợ override đổi category riêng cho 1 ngày, và POST /internal/reminders/dispatch tạo thông báo đúng tiền tố (Tiết dạy / Ca dạy thêm / Lịch học)', async () => {
        const { harness, userId } = await createOnboardedTeacher('SchedCatReminders');

        await harness.services.push.createPushSubscription({
          endpoint: `https://fcm.googleapis.com/fcm/send/${userId}`,
          keys: DUMMY_PUSH_KEYS,
        });

        // Hôm nay theo FixedClock là Thứ Năm 2026-10-29 (weekday = 4), giờ 09:45 (remindAt cho các buổi bắt đầu lúc 10:00 với lead = 15m)
        // 1. Tạo TimetableSlot trên lớp (school_teaching) vào Thứ Năm 10:00-10:45
        const schoolSlot = await harness.services.timetableSlots.create({
          weekday: 4,
          startTime: '10:00',
          endTime: '10:45',
          subject: 'Ngữ văn',
          grade: '10A1',
          room: 'P.201',
          tone: 'blue',
          category: 'school_teaching',
          effectiveFrom: '2026-10-01',
        });

        // 2. Tạo TimetableSlot vào Thứ Năm 09:58-11:30 để kiểm tra override category trên 1 ngày cụ thể (remindAt = 09:43 cũng nằm trong cửa sổ (09:35, 09:45] và không trùng giờ với schoolSlot 10:00-10:45 nếu chọn 10:45-11:30? Nhưng 10:45 có remindAt = 10:30. Thay vào đó tạo ở Thứ Sáu hoặc tạo cho 1 giáo viên riêng hoặc chọn 09:15-09:55 với leadMinutes = 30!)
        const { harness: harnessOverride, userId: userOverrideId } =
          await createOnboardedTeacher('SchedCatOverride');
        await harnessOverride.services.push.createPushSubscription({
          endpoint: `https://fcm.googleapis.com/fcm/send/${userOverrideId}`,
          keys: DUMMY_PUSH_KEYS,
        });

        const afternoonSlot = await harnessOverride.services.timetableSlots.create({
          weekday: 4,
          startTime: '10:00',
          endTime: '11:30',
          subject: 'Chuyên đề Văn học',
          grade: '12A',
          room: 'P.305',
          tone: 'mint',
          category: 'school_teaching',
          effectiveFrom: '2026-10-01',
        });

        // Kiểm tra buổi sinh từ slot kế thừa đúng category = school_teaching
        const sessionsBeforeOverride = await harnessOverride.services.classSessions.list({
          from: '2026-10-29',
          to: '2026-11-05',
        });
        const generatedOct29 = sessionsBeforeOverride.items.find(
          (s) => s.id === `${afternoonSlot.id}:2026-10-29`,
        );
        const generatedNov05 = sessionsBeforeOverride.items.find(
          (s) => s.id === `${afternoonSlot.id}:2026-11-05`,
        );
        expect(generatedOct29?.category).toBe('school_teaching');
        expect(generatedNov05?.category).toBe('school_teaching');

        // Override buổi ngày 2026-10-29 của afternoonSlot sang category = extra_teaching
        const overriddenSession = await harnessOverride.services.classSessions.update(
          `${afternoonSlot.id}:2026-10-29`,
          {
            category: 'extra_teaching',
            topic: 'Luyện đề nghị luận xã hội nâng cao',
          },
        );
        expect(overriddenSession.category).toBe('extra_teaching');

        // Buổi tuần sau (2026-11-05) vẫn giữ nguyên category = school_teaching của slot gốc
        const sessionsAfterOverride = await harnessOverride.services.classSessions.list({
          from: '2026-10-29',
          to: '2026-11-05',
        });
        expect(
          sessionsAfterOverride.items.find((s) => s.id === `${afternoonSlot.id}:2026-10-29`)
            ?.category,
        ).toBe('extra_teaching');
        expect(
          sessionsAfterOverride.items.find((s) => s.id === `${afternoonSlot.id}:2026-11-05`)
            ?.category,
        ).toBe('school_teaching');

        // 3. Tạo Ad-hoc ClassSession với category = self_study vào 2026-10-29 lúc 10:00
        const selfStudySession = await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '10:00',
          endTime: '11:30',
          subject: 'Speaking IELTS Workshop',
          room: 'Phòng Lab 2',
          tone: 'lavender',
          category: 'self_study',
        });

        // 4. Gọi POST /internal/reminders/dispatch tại mốc 09:45 (2026-10-29T02:45:00.000Z)
        fakePushSender.clear();
        const dispatchRes = await callDispatch();
        expect(dispatchRes.status).toBe(200);
        expect(dispatchRes.body.sent).toBeGreaterThanOrEqual(3);

        // Kiểm chứng thông báo Web Push gửi đi có đúng tiền tố của từng loại lịch
        const pushTitles = fakePushSender.getSentMessages().map((m) => m.payload.title);
        expect(pushTitles).toContain('Tiết dạy: Ngữ văn 10A1');
        expect(pushTitles).toContain('Ca dạy thêm: Chuyên đề Văn học 12A');
        expect(pushTitles).toContain('Lịch học: Speaking IELTS Workshop');

        // Kiểm chứng InAppNotification qua FE notificationService khớp 100% với formatClassSessionReminderNotification của FE
        const inAppList = await harness.services.notifications.list();
        const inAppOverrideList = await harnessOverride.services.notifications.list();
        const notifSchool = inAppList.items.find(
          (n) => n.targetId === `${schoolSlot.id}:2026-10-29`,
        );
        const notifExtra = inAppOverrideList.items.find(
          (n) => n.targetId === `${afternoonSlot.id}:2026-10-29`,
        );
        const notifStudy = inAppList.items.find((n) => n.targetId === selfStudySession.id);

        expect(notifSchool?.title).toBe('Tiết dạy: Ngữ văn 10A1');
        expect(notifExtra?.title).toBe('Ca dạy thêm: Chuyên đề Văn học 12A');
        expect(notifStudy?.title).toBe('Lịch học: Speaking IELTS Workshop');

        // Đồng bộ với hàm formatClassSessionReminderNotification & evaluateDueReminders phía FE
        const feFormattedExtra = formatClassSessionReminderNotification('vi', {
          id: overriddenSession.id,
          date: overriddenSession.date,
          startTime: '10:00',
          subject: overriddenSession.subject,
          grade: overriddenSession.grade,
          room: overriddenSession.room,
          category: overriddenSession.category,
        });
        expect(feFormattedExtra.title).toBe(notifExtra?.title);
        expect(feFormattedExtra.body).toBe(notifExtra?.body);

        const dueFromTicker = evaluateDueReminders({
          tasks: [],
          classSessions: [selfStudySession],
          notes: [],
          leadMinutes: 15,
          timeZone: 'Asia/Ho_Chi_Minh',
          locale: 'vi',
          now: baseFixedNow,
          storage: null,
        });
        expect(dueFromTicker).toHaveLength(1);
        expect(dueFromTicker[0]?.title).toBe('Lịch học: Speaking IELTS Workshop');
      });
    });

    // =========================================================================
    // 2. Trợ lý AI Đa phương thức & Bản nháp AI Schedule Draft
    // =========================================================================
    describe('US 5, 6, 7, 8, 9: Gửi tin nhắn & ảnh TKB, Quy đổi Tiết 1..10, Cảnh báo trùng lịch & Áp dụng AI Schedule Draft', () => {
      it('gửi ảnh Thời khóa biểu qua FE aiAssistantService.sendMessage (FormData): lưu ảnh với imageExpiresAt = now + 45 ngày, quy đổi Tiết 1..10 sang HH:mm và tự động gắn conflict với TimetableSlot hiện có', async () => {
        const { harness } = await createOnboardedTeacher('AiMultimodalImage');

        // 1. Tạo sẵn 1 TimetableSlot hiện có vào Thứ Hai (weekday = 1) Tiết 1 (07:00 - 07:45)
        const existingSlot = await harness.services.timetableSlots.create({
          weekday: 1,
          startTime: '07:00',
          endTime: '07:45',
          subject: 'Toán 9A (Lịch cũ)',
          grade: '9A',
          room: 'P.101',
          tone: 'pink',
          category: 'school_teaching',
          effectiveFrom: '2026-09-01',
        });

        // 2. Cấu hình FakeAiAssistant sử dụng đúng bảng standardPeriodTimes từ context của BE để quy đổi Tiết 1 Sáng & Tiết 1 Chiều (Tiết 6)
        fakeAi.setHandler((input) => {
          const period1Morning = input.context.standardPeriodTimes.find(
            (p) => p.session === 'morning' && p.periodInSession === 1,
          )!;
          const period1Afternoon = input.context.standardPeriodTimes.find(
            (p) => p.session === 'afternoon' && p.periodInSession === 1,
          )!;

          return {
            reply:
              'Em đã đọc ảnh Thời khóa biểu và quy đổi Tiết 1 sáng (07:00–07:45), Tiết 1 chiều (13:30–14:15) thành bản nháp cho cô.',
            draftItems: [
              {
                id: 'draft-slot-conflict',
                kind: 'timetable_slot',
                category: 'school_teaching',
                titleOrSubject: 'Toán Hình 9A (Mới)',
                grade: '9A',
                room: 'P.202',
                weekday: 1,
                startTime: period1Morning.startTime,
                endTime: period1Morning.endTime,
                effectiveFrom: input.context.today,
                tone: 'blue',
              },
              {
                id: 'draft-slot-afternoon',
                kind: 'timetable_slot',
                category: 'extra_teaching',
                titleOrSubject: 'Bồi dưỡng Toán 9B',
                grade: '9B',
                room: 'P.205',
                weekday: 2,
                startTime: period1Afternoon.startTime,
                endTime: period1Afternoon.endTime,
                effectiveFrom: input.context.today,
                tone: 'mint',
              },
            ],
          };
        });

        // 3. Tạo File ảnh JPEG hợp lệ (<= 5MB) và kiểm tra helper validateAiImageFile của FE
        const imageFile = new File([VALID_JPEG_BYTES], 'tkb-hoc-ky-1.jpg', {
          type: 'image/jpeg',
        });
        expect(validateAiImageFile(imageFile)).toEqual({ valid: true });

        // 4. Gửi tin nhắn kèm ảnh qua FE aiAssistantService.sendMessage
        const sendResult = await harness.services.aiAssistant.sendMessage({
          message: 'Nhập TKB từ ảnh chụp này giúp chị',
          image: imageFile,
        });

        // Kiểm chứng userMessage có imageUrl và imageExpiresAt = now + 45 ngày
        expect(sendResult.userMessage.role).toBe('user');
        expect(sendResult.userMessage.content).toBe('Nhập TKB từ ảnh chụp này giúp chị');
        expect(sendResult.userMessage.imageUrl).toContain('http://localhost:9000/avatars/ai-chat/');
        const expectedExpiresAt = new Date(
          baseFixedNow.getTime() + 45 * 24 * 60 * 60 * 1000,
        ).toISOString();
        expect(sendResult.userMessage.imageExpiresAt).toBe(expectedExpiresAt);
        expect(fakeStorage.putCalls).toHaveLength(1);
        expect(fakeStorage.putCalls[0]?.contentType).toBe('image/jpeg');

        // Kiểm chứng dữ liệu ảnh base64 và bảng 10 tiết chuẩn đã được truyền vào AiAssistantPort
        expect(fakeAi.calls).toHaveLength(1);
        expect(fakeAi.calls[0]?.image?.mimeType).toBe('image/jpeg');
        expect(fakeAi.calls[0]?.context.standardPeriodTimes).toHaveLength(10);
        expect(fakeAi.calls[0]?.context.standardPeriodTimes[0]).toMatchObject({
          period: 1,
          startTime: '07:00',
          endTime: '07:45',
        });
        expect(fakeAi.calls[0]?.context.standardPeriodTimes[5]).toMatchObject({
          period: 6,
          session: 'afternoon',
          periodInSession: 1,
          startTime: '13:30',
          endTime: '14:15',
        });

        // Kiểm chứng assistantMessage trả về draft có giờ đã quy đổi và đánh dấu conflict chính xác
        const draft = sendResult.assistantMessage.draft;
        expect(draft).toBeDefined();
        expect(draft?.status).toBe('pending');
        expect(draft?.items).toHaveLength(2);

        const item1 = draft!.items[0]!;
        expect(item1.startTime).toBe('07:00');
        expect(item1.endTime).toBe('07:45');
        expect(item1.conflict).toEqual({
          slotId: existingSlot.id,
          subject: 'Toán 9A (Lịch cũ)',
          startTime: '07:00',
          endTime: '07:45',
        });

        const item2 = draft!.items[1]!;
        expect(item2.startTime).toBe('13:30');
        expect(item2.endTime).toBe('14:15');
        expect(item2.category).toBe('extra_teaching');
        expect(item2.conflict).toBeNull();
      });

      it('chặn ảnh sai định dạng hoặc > 5MB ở cả helper FE và BE multipart endpoint với lỗi 400 validation', async () => {
        const { harness } = await createOnboardedTeacher('AiInvalidImage');

        // 1. Kiểm tra file sai định dạng (PDF giả làm file upload)
        const pdfBytes = new TextEncoder().encode('%PDF-1.5 fake schedule pdf');
        const pdfFile = new File([pdfBytes], 'schedule.pdf', {
          type: 'application/pdf',
        });
        expect(validateAiImageFile(pdfFile)).toEqual({
          valid: false,
          error: 'unsupported_file_type',
          errorKey: 'aiAssistant.imageUnsupportedType',
        });

        const badFormatErr = await harness.services.aiAssistant
          .sendMessage({
            message: 'Gửi file sai định dạng',
            image: pdfFile,
          })
          .catch((e: unknown) => e);

        expect(badFormatErr).toBeInstanceOf(ApiError);
        expect((badFormatErr as ApiError).status).toBe(400);
        expect((badFormatErr as ApiError).code).toBe('validation');

        // 2. Kiểm tra file > 5MB
        const hugeBytes = new Uint8Array(5 * 1024 * 1024 + 256);
        hugeBytes.set(VALID_JPEG_BYTES, 0);
        const hugeFile = new File([hugeBytes], 'huge-tkb.jpg', {
          type: 'image/jpeg',
        });
        expect(validateAiImageFile(hugeFile)).toEqual({
          valid: false,
          error: 'file_too_large',
          errorKey: 'aiAssistant.imageTooLarge',
        });

        const hugeErr = await harness.services.aiAssistant
          .sendMessage({
            message: 'Gửi ảnh quá 5MB',
            image: hugeFile,
          })
          .catch((e: unknown) => e);

        expect(hugeErr).toBeInstanceOf(ApiError);
        expect((hugeErr as ApiError).status).toBe(400);
        expect((hugeErr as ApiError).code).toBe('validation');
      });

      it('áp dụng bản nháp với chiến lược skip_conflicts: giữ nguyên TimetableSlot cũ bị trùng, chỉ tạo các mục không trùng (timetable_slot, class_session, task)', async () => {
        const { harness } = await createOnboardedTeacher('AiApplySkipConflicts');

        // Tạo slot hiện có vào Thứ Ba (weekday = 2) 18:00 - 19:30
        const existingTueSlot = await harness.services.timetableSlots.create({
          weekday: 2,
          startTime: '18:00',
          endTime: '19:30',
          subject: 'Toán 9A (Cố định Thứ 3)',
          grade: '9A',
          room: 'P.101',
          tone: 'blue',
          category: 'extra_teaching',
          effectiveFrom: '2026-10-01',
        });

        // Gửi tin nhắn yêu cầu thêm lịch dạy thêm Thứ 3 (trùng), Thứ 5 (không trùng), 1 buổi lẻ và 1 công việc
        fakeAi.setNextReply({
          reply: 'Em đã tạo bản nháp gồm 4 mục theo yêu cầu của cô.',
          draftItems: [
            {
              id: 'skip-item-1',
              kind: 'timetable_slot',
              category: 'extra_teaching',
              titleOrSubject: 'Toán 9B (Trùng Thứ 3)',
              grade: '9B',
              room: 'P.202',
              weekday: 2,
              startTime: '18:00',
              endTime: '19:30',
              effectiveFrom: '2026-10-29',
              tone: 'mint',
            },
            {
              id: 'skip-item-2',
              kind: 'timetable_slot',
              category: 'extra_teaching',
              titleOrSubject: 'Toán 9A (Thứ 5 mới)',
              grade: '9A',
              room: 'P.101',
              weekday: 4,
              startTime: '18:00',
              endTime: '19:30',
              effectiveFrom: '2026-10-29',
              tone: 'mint',
            },
            {
              id: 'skip-item-3',
              kind: 'class_session',
              category: 'self_study',
              titleOrSubject: 'Học chuyên đề Phương pháp giảng dạy số',
              room: 'Hội trường A',
              date: '2026-10-31',
              startTime: '08:30',
              endTime: '11:00',
              tone: 'lavender',
              notes: 'Mang theo laptop cá nhân',
            },
            {
              id: 'skip-item-4',
              kind: 'task',
              category: 'school_teaching',
              titleOrSubject: 'In phiếu bài tập hình học 9A',
              date: '2026-10-30',
              startTime: '16:00',
              notes: 'In 40 bản',
            },
          ],
        });

        const sendRes = await harness.services.aiAssistant.sendMessage({
          message:
            'Thêm lịch dạy thêm Toán tối Thứ 3, Thứ 5 18:00-19:30, buổi học chuyên đề 31/10 và việc in phiếu bài tập',
        });

        const assistantMsg = sendRes.assistantMessage;
        expect(assistantMsg.draft?.status).toBe('pending');
        expect(assistantMsg.draft?.items[0]?.conflict?.slotId).toBe(existingTueSlot.id);
        expect(assistantMsg.draft?.items[1]?.conflict).toBeNull();

        // Áp dụng bản nháp với skip_conflicts qua helper submitAiScheduleDraft của FE AiScheduleDraftCard
        const allIds = new Set(assistantMsg.draft!.items.map((i) => i.id));
        const applyRes = await submitAiScheduleDraft({
          messageId: assistantMsg.id,
          items: assistantMsg.draft!.items,
          selectedIds: allIds,
          conflictStrategy: 'skip_conflicts',
          applyDraftMutation: ({ messageId, conflictStrategy, items }) =>
            harness.services.aiAssistant.applyDraft(messageId, {
              conflictStrategy,
              items,
            }),
        });

        expect(applyRes.summary).toEqual({
          createdCount: 3,
          replacedCount: 0,
          skippedCount: 1,
        });
        expect(applyRes.message.draft?.status).toBe('applied');
        expect(applyRes.message.draft?.conflictStrategy).toBe('skip_conflicts');
        expect(applyRes.message.draft?.summary).toEqual({
          createdCount: 3,
          replacedCount: 0,
          skippedCount: 1,
        });

        // Kiểm chứng TimetableSlot cũ vào Thứ 3 vẫn nguyên vẹn (effectiveTo = null) và không tạo slot trùng
        const slotsAfter = await harness.services.timetableSlots.list();
        const keptTueSlot = slotsAfter.items.find((s) => s.id === existingTueSlot.id);
        expect(keptTueSlot).toBeDefined();
        expect(keptTueSlot?.effectiveTo ?? null).toBeNull();
        expect(
          slotsAfter.items.some((s) => s.subject === 'Toán 9B (Trùng Thứ 3)'),
        ).toBe(false);

        // Mục Thứ 5 không trùng đã được tạo
        const createdThuSlot = slotsAfter.items.find(
          (s) => s.subject === 'Toán 9A (Thứ 5 mới)',
        );
        expect(createdThuSlot).toBeDefined();
        expect(createdThuSlot?.category).toBe('extra_teaching');

        // Buổi học lẻ (class_session) đã được tạo
        const sessionsAfter = await harness.services.classSessions.list({
          from: '2026-10-29',
          to: '2026-11-01',
        });
        const createdSession = sessionsAfter.items.find(
          (s) => s.subject === 'Học chuyên đề Phương pháp giảng dạy số',
        );
        expect(createdSession).toBeDefined();
        expect(createdSession?.category).toBe('self_study');
        expect(createdSession?.topic).toBe('Mang theo laptop cá nhân');

        // Công việc (task) đã được tạo
        const tasksAfter = await harness.services.tasks.list({
          from: '2026-10-29',
          to: '2026-11-01',
        });
        const createdTask = tasksAfter.items.find(
          (t) => t.title === 'In phiếu bài tập hình học 9A',
        );
        expect(createdTask).toBeDefined();
        expect(createdTask?.category).toBe('school');
        expect(createdTask?.time).toBe('16:00');
      });

      it('chỉnh sửa nhanh mục nháp trên FE rồi áp dụng với replace_conflicts: tự động kết thúc hiệu lực hoặc xóa mềm slot cũ bị trùng, tạo slot mới, và chặn bấm áp dụng lại với lỗi 409 ai_draft_already_applied', async () => {
        const { harness } = await createOnboardedTeacher('AiApplyReplaceConflicts');

        // 1. Tạo 2 TimetableSlot hiện có:
        // - pastSlot: bắt đầu trong quá khứ (2026-09-01 < today 2026-10-29) -> khi replace sẽ được kết thúc hiệu lực (effectiveTo = 2026-10-28)
        const pastSlot = await harness.services.timetableSlots.create({
          weekday: 1,
          startTime: '07:00',
          endTime: '07:45',
          subject: 'Vật lý 10A (Từ đầu kỳ)',
          grade: '10A',
          room: 'P.101',
          tone: 'blue',
          category: 'school_teaching',
          effectiveFrom: '2026-09-01',
        });

        // - todaySlot: bắt đầu từ hôm nay (2026-10-29 >= targetEffectiveFrom 2026-10-29) -> khi replace sẽ bị xóa mềm (soft-deleted)
        const todaySlot = await harness.services.timetableSlots.create({
          weekday: 3,
          startTime: '18:00',
          endTime: '19:30',
          subject: 'Dạy thêm Lý 11 (Vừa tạo hôm nay)',
          grade: '11B',
          room: 'P.201',
          tone: 'mint',
          category: 'extra_teaching',
          effectiveFrom: '2026-10-29',
        });

        const beforeApplyCheckpoint = new Date(
          baseFixedNow.getTime() - 1000,
        ).toISOString();

        // 2. Gửi ảnh PNG Thời khóa biểu mới có 2 mục trùng với pastSlot và todaySlot
        fakeAi.setNextReply({
          reply: 'Em đã bóc tách 2 tiết học từ ảnh TKB mới.',
          draftItems: [
            {
              id: 'replace-item-1',
              kind: 'timetable_slot',
              category: 'school_teaching',
              titleOrSubject: 'Vật lý 10A (TKB Mới)',
              grade: '10A',
              room: 'P.102',
              weekday: 1,
              startTime: '07:00',
              endTime: '07:45',
              effectiveFrom: '2026-10-29',
              tone: 'blue',
            },
            {
              id: 'replace-item-2',
              kind: 'timetable_slot',
              category: 'extra_teaching',
              titleOrSubject: 'Luyện thi HSG Lý 11',
              grade: '11B',
              room: 'P.202',
              weekday: 3,
              startTime: '18:00',
              endTime: '19:30',
              effectiveFrom: '2026-10-29',
              tone: 'lavender',
            },
          ],
        });

        const pngFile = new File([VALID_PNG_BYTES], 'tkb-moi.png', { type: 'image/png' });
        const sendRes = await harness.services.aiAssistant.sendMessage({
          image: pngFile,
        });

        const draftMsg = sendRes.assistantMessage;
        expect(draftMsg.draft?.items[0]?.conflict?.slotId).toBe(pastSlot.id);
        expect(draftMsg.draft?.items[1]?.conflict?.slotId).toBe(todaySlot.id);

        // 3. Giáo viên sửa nhanh tên phòng của mục 1 trên UI trước khi bấm xác nhận (qua updateDraftItemField & buildApplyDraftPayload)
        const editedItems = updateDraftItemField(
          draftMsg.draft!.items,
          'replace-item-1',
          {
            room: 'Phòng Lab Lý 301',
            titleOrSubject: 'Vật lý 10A Thực hành (TKB Mới)',
          },
        );
        const payload = buildApplyDraftPayload(
          editedItems,
          new Set(['replace-item-1', 'replace-item-2']),
          'replace_conflicts',
        );

        const applyRes = await harness.services.aiAssistant.applyDraft(
          draftMsg.id,
          payload,
        );

        expect(applyRes.summary).toEqual({
          createdCount: 2,
          replacedCount: 2,
          skippedCount: 0,
        });
        expect(applyRes.message.draft?.status).toBe('applied');
        expect(applyRes.message.draft?.appliedAt).toBe(baseFixedNow.toISOString());

        // 4. Kiểm chứng trên GET /timetable-slots:
        // - pastSlot được giữ lại lịch sử với effectiveTo = '2026-10-28'
        // - todaySlot bị xóa mềm (nằm trong deletedIds khi sync delta và không còn trong items active)
        // - 2 slot mới được tạo với thông tin đã chỉnh sửa
        const slotsEnvelope = await harness.services.timetableSlots.list();
        const deltaEnvelope = await harness.services.timetableSlots.list({
          updatedSince: beforeApplyCheckpoint,
        });
        const updatedPastSlot = slotsEnvelope.items.find((s) => s.id === pastSlot.id);
        expect(updatedPastSlot).toBeDefined();
        expect(updatedPastSlot?.effectiveTo).toBe('2026-10-28');

        expect(slotsEnvelope.items.some((s) => s.id === todaySlot.id)).toBe(false);
        expect(deltaEnvelope.deletedIds).toContain(todaySlot.id);

        const newSlot1 = slotsEnvelope.items.find(
          (s) => s.subject === 'Vật lý 10A Thực hành (TKB Mới)',
        );
        expect(newSlot1).toBeDefined();
        expect(newSlot1?.room).toBe('Phòng Lab Lý 301');

        const newSlot2 = slotsEnvelope.items.find(
          (s) => s.subject === 'Luyện thi HSG Lý 11',
        );
        expect(newSlot2).toBeDefined();
        expect(newSlot2?.category).toBe('extra_teaching');

        // 5. Bấm áp dụng lại cùng bản nháp đã applied -> bị chặn với lỗi 409 ai_draft_already_applied
        const duplicateErr = await harness.services.aiAssistant
          .applyDraft(draftMsg.id, {
            conflictStrategy: 'replace_conflicts',
          })
          .catch((e: unknown) => e);

        expect(duplicateErr).toBeInstanceOf(ApiError);
        expect((duplicateErr as ApiError).status).toBe(409);
        expect((duplicateErr as ApiError).code).toBe('ai_draft_already_applied');
        expect((duplicateErr as ApiError).messageKey).toBe('errors.aiDraftAlreadyApplied');
      });
    });

    // =========================================================================
    // 3. Hỏi đáp lịch & việc trong ngày (Context 4 miền dữ liệu)
    // =========================================================================
    describe('US 10: Hỏi đáp lịch dạy, lịch học, công việc và ghi chú trong ngày/tuần', () => {
      it('tổng hợp đầy đủ context 4 miền (TimetableSlot, ClassSession, Task, Note) của giáo viên truyền vào AiAssistantPort và trả câu trả lời chính xác', async () => {
        const { harness } = await createOnboardedTeacher('AiDailyQuery');

        // Tạo dữ liệu thật trên cả 4 miền cho Thứ Năm 2026-10-29:
        // 1. TimetableSlot (school_teaching)
        await harness.services.timetableSlots.create({
          weekday: 4,
          startTime: '07:00',
          endTime: '08:35',
          subject: 'Toán Hình học 10A',
          grade: '10A',
          room: 'P.101',
          tone: 'blue',
          category: 'school_teaching',
          effectiveFrom: '2026-10-01',
        });

        // 2. Ad-hoc ClassSession (extra_teaching & self_study)
        await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '18:00',
          endTime: '19:30',
          subject: 'Phụ đạo Toán 9C',
          grade: '9C',
          room: 'Phòng học thêm',
          tone: 'mint',
          category: 'extra_teaching',
        });
        await harness.services.classSessions.create({
          date: '2026-10-29',
          startTime: '20:00',
          endTime: '21:30',
          subject: 'Luyện đề IELTS Listening',
          tone: 'lavender',
          category: 'self_study',
        });

        // 3. Task (công việc cần làm)
        await harness.services.tasks.create({
          title: 'Chấm bài kiểm tra giữa kỳ 10A',
          date: '2026-10-29',
          time: '15:00',
          category: 'school',
          priority: 'high',
        });

        // 4. Note (ghi chú có hạn)
        await harness.services.notes.create({
          title: 'Nhắc học sinh 10A nộp sổ đoàn',
          content: 'Thu trước 11h trưa thứ Năm',
          dueDate: '2026-10-29',
          remindTime: '09:00',
        });

        // Cấu hình FakeAiAssistant kiểm tra context 4 miền nhận được và tổng hợp câu trả lời
        fakeAi.setHandler((input) => {
          const { context } = input;
          const slotNames = context.timetableSlots.map((s) => `${s.subject} (${s.category})`);
          const todaySessions = context.classSessions
            .filter((s) => s.date === context.today)
            .map((s) => `${s.subject} [${s.category}]`);
          const taskTitles = context.tasks.map((t) => t.title);
          const noteTitles = context.notes.map((n) => n.title);

          return {
            reply: [
              `Hôm nay (${context.today}) cô có:`,
              `- Lịch dạy & học (${todaySessions.length} buổi): ${todaySessions.join(', ')}`,
              `- TKB định kỳ: ${slotNames.join(', ')}`,
              `- Công việc (${taskTitles.length}): ${taskTitles.join(', ')}`,
              `- Ghi chú (${noteTitles.length}): ${noteTitles.join(', ')}`,
            ].join('\n'),
          };
        });

        const res = await harness.services.aiAssistant.sendMessage({
          message: 'Hôm nay tôi có lịch gì và cần làm những việc gì?',
        });

        expect(fakeAi.calls).toHaveLength(1);
        const passedContext = fakeAi.calls[0]!.context;
        expect(passedContext.today).toBe('2026-10-29');
        expect(passedContext.weekday).toBe(4);
        expect(passedContext.timetableSlots).toHaveLength(1);
        expect(
          passedContext.classSessions.filter((s) => s.date === '2026-10-29'),
        ).toHaveLength(3);
        expect(passedContext.tasks).toHaveLength(1);
        expect(passedContext.notes).toHaveLength(1);

        // Kiểm chứng câu trả lời từ AI không tạo draft và chứa đầy đủ thông tin 4 miền
        expect(res.assistantMessage.draft).toBeNull();
        expect(res.assistantMessage.content).toContain('Toán Hình học 10A [school_teaching]');
        expect(res.assistantMessage.content).toContain('Phụ đạo Toán 9C [extra_teaching]');
        expect(res.assistantMessage.content).toContain('Luyện đề IELTS Listening [self_study]');
        expect(res.assistantMessage.content).toContain('Chấm bài kiểm tra giữa kỳ 10A');
        expect(res.assistantMessage.content).toContain('Nhắc học sinh 10A nộp sổ đoàn');
      });
    });

    // =========================================================================
    // 4. Lịch sử hội thoại & Tự động xóa ảnh sau 45 ngày
    // =========================================================================
    describe('US 11 & 12: Lịch sử hội thoại (GET/DELETE /ai-assistant/messages) & Tự động xóa ảnh quá hạn 45 ngày', () => {
      it('khi Clock tiến qua mốc +45 ngày rồi gọi POST /internal/reminders/dispatch, ảnh quá hạn bị xóa khỏi ObjectStorage và imageUrl/imageExpiresAt về null trong khi nội dung chữ và draft vẫn giữ nguyên; hỗ trợ DELETE lịch sử', async () => {
        const { harness } = await createOnboardedTeacher('AiRetention45Days');

        // 1. Gửi tin nhắn có ảnh kèm bản nháp
        fakeAi.setNextReply({
          reply: 'Đã phân tích ảnh TKB học kỳ 1 của cô.',
          draftItems: [
            {
              id: 'ret-draft-1',
              kind: 'timetable_slot',
              category: 'school_teaching',
              titleOrSubject: 'Hóa học 10A',
              grade: '10A',
              room: 'P.105',
              weekday: 5,
              startTime: '07:00',
              endTime: '07:45',
              effectiveFrom: '2026-10-29',
              tone: 'blue',
            },
          ],
        });

        const jpegFile = new File([VALID_JPEG_BYTES], 'tkb-retention.jpg', {
          type: 'image/jpeg',
        });
        const sendRes = await harness.services.aiAssistant.sendMessage({
          message: 'Lưu lịch Hóa 10A từ ảnh này',
          image: jpegFile,
        });

        const userMsgId = sendRes.userMessage.id;
        const assistantMsgId = sendRes.assistantMessage.id;
        const uploadedKey = fakeStorage.putCalls[0]!.key;

        expect(fakeStorage.hasObject('avatars', uploadedKey)).toBe(true);
        expect(sendRes.userMessage.imageUrl).toContain(uploadedKey);
        expect(sendRes.userMessage.imageExpiresAt).not.toBeNull();

        // 2. Trước 45 ngày (ví dụ +44 ngày): gọi dispatch -> ảnh CHƯA bị xóa
        clock.advance(44 * 24 * 60 * 60 * 1000);
        await callDispatch();

        expect(fakeStorage.deleteCalls).toHaveLength(0);
        expect(fakeStorage.hasObject('avatars', uploadedKey)).toBe(true);

        const listAt44Days = await harness.services.aiAssistant.listMessages();
        const userMsgAt44 = listAt44Days.items.find((m) => m.id === userMsgId);
        expect(userMsgAt44?.imageUrl).toContain(uploadedKey);

        // 3. Tiến Clock qua mốc +45 ngày (+2 ngày nữa = 46 ngày kể từ lúc gửi) và gọi POST /internal/reminders/dispatch
        clock.advance(2 * 24 * 60 * 60 * 1000);
        const dispatchAfter45Days = await callDispatch();
        expect(dispatchAfter45Days.status).toBe(200);

        // Kiểm chứng ảnh đã bị xóa khỏi ObjectStorage
        expect(fakeStorage.deleteCalls).toContainEqual({
          bucket: 'avatars',
          key: uploadedKey,
        });
        expect(fakeStorage.hasObject('avatars', uploadedKey)).toBe(false);

        // Kiểm chứng qua FE aiAssistantService.listMessages:
        // - imageUrl và imageExpiresAt đã về null
        // - Nội dung chữ của userMessage và assistantMessage + draft vẫn được giữ nguyên
        const listAfter45Days = await harness.services.aiAssistant.listMessages();
        expect(listAfter45Days.items).toHaveLength(2);

        const purgedUserMsg = listAfter45Days.items.find((m) => m.id === userMsgId);
        expect(purgedUserMsg).toBeDefined();
        expect(purgedUserMsg?.content).toBe('Lưu lịch Hóa 10A từ ảnh này');
        expect(purgedUserMsg?.imageUrl).toBeNull();
        expect(purgedUserMsg?.imageExpiresAt).toBeNull();

        const keptAssistantMsg = listAfter45Days.items.find((m) => m.id === assistantMsgId);
        expect(keptAssistantMsg).toBeDefined();
        expect(keptAssistantMsg?.content).toBe('Đã phân tích ảnh TKB học kỳ 1 của cô.');
        expect(keptAssistantMsg?.draft?.items).toHaveLength(1);
        expect(keptAssistantMsg?.draft?.items[0]?.titleOrSubject).toBe('Hóa học 10A');

        // 4. Xóa toàn bộ lịch sử trò chuyện qua FE aiAssistantService.clearMessages (DELETE /ai-assistant/messages)
        await harness.services.aiAssistant.clearMessages();

        const listAfterClear = await harness.services.aiAssistant.listMessages();
        expect(listAfterClear.items).toHaveLength(0);
      });
    });
  },
);
