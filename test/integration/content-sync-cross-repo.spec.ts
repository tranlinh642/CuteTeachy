import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services';
import { ApiError } from '@/lib/api/api-error';
import { generateClientUuid } from '@/lib/sync';
import type { AuthSession, Task, Tag } from '@/types';

// =============================================================================
// SPEC-003 Integration Test Suite (CuteTeachy-FE ↔ CuteTeachy-BE)
// Validates User Stories 1–31 against live NestJS + PostgreSQL.
// Runs on a dedicated port (4002) to avoid collisions with other test runs.
// =============================================================================

const candidates = [
  path.resolve(__dirname, '../../../CuteTeachy-BE'),
  path.resolve(__dirname, '../../../../CuteTeachy-BE'),
];
const BE_DIR = candidates.find((c) => fs.existsSync(c)) || candidates[0];
const BE_PORT = process.env.BE_PORT_SPEC003 || '4002';
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

async function waitForHttpHealthy(url: string, maxWaitMs = 12000): Promise<boolean> {
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

describe('SPEC-003 Full Integration Test Suite (FE ↔ BE live)', { timeout: 20000 }, () => {
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
        beAvailable = await waitForHttpHealthy(BE_URL, 12000);
      } catch {
        beAvailable = false;
      }
    }
  }, 20000);

  afterAll(async () => {
    stopProcess(spawnedBe);
  });

let ipCounter = 1;
function getNextTestIp(): string {
  ipCounter++;
  const b = Math.floor(ipCounter / 250);
  const c = ipCounter % 250;
  return `10.200.${b}.${c}`;
}

// Helper to register and complete onboarding for a fresh teacher
async function createOnboardedTeacher(name: string, customIp?: string) {
  const ip = customIp ?? getNextTestIp();
  const harness = createTestClient({ baseURL: BE_URL, ip });
  const email = `${name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@cuteteachy.local`;
  const reg = await harness.services.auth.register({ email, password: 'Password123' });
  harness.setToken(reg.accessToken);
  harness.setRefreshToken(reg.refreshToken);

  await harness.services.auth.updateProfile({
    fullName: `Cô giáo ${name}`,
    displayName: name,
    gender: 'female',
  });

  return { harness, email, userId: reg.user.id };
}

  // ===========================================================================
  // User Stories 1–10: Tasks
  // ===========================================================================
  describe('User Stories 1–10: Tasks (Việc cần làm trường học & cá nhân)', () => {
    it('US 1: Thêm Task cho một ngày với hình dạng hợp lệ', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task1');

      const task = await harness.services.tasks.create({
        title: 'Soạn giáo án bài 12',
        date: '2026-11-05',
        category: 'school',
      });

      expect(typeof task.id).toBe('string');
      expect(task.title).toBe('Soạn giáo án bài 12');
      expect(task.date).toBe('2026-11-05');
      expect(task.category).toBe('school');
      expect(task.priority).toBe('normal');
      expect(task.completed).toBe(false);
      expect(task.tagIds).toEqual([]);
      expect(typeof task.createdAt).toBe('string');
      expect(typeof task.updatedAt).toBe('string');
    });

    it('US 2: Gắn giờ cho Task (tùy chọn)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task2');

      const task = await harness.services.tasks.create({
        title: 'Họp phụ huynh đầu năm',
        date: '2026-11-08',
        time: '08:30',
        category: 'school',
      });

      expect(task.time).toBe('08:30');
    });

    it('US 3: Phân loại Task là việc trường (school) hoặc cá nhân (personal)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task3');

      const schoolTask = await harness.services.tasks.create({
        title: 'Chấm bài kiểm tra 1 tiết',
        date: '2026-11-09',
        category: 'school',
      });
      const personalTask = await harness.services.tasks.create({
        title: 'Đi mua đồ dùng văn phòng phẩm',
        date: '2026-11-09',
        category: 'personal',
      });

      expect(schoolTask.category).toBe('school');
      expect(personalTask.category).toBe('personal');
    });

    it('US 4: Đánh dấu Task ưu tiên cao (priority: high)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task4');

      const task = await harness.services.tasks.create({
        title: 'Nộp báo cáo thanh tra sở',
        date: '2026-11-10',
        category: 'school',
        priority: 'high',
      });

      expect(task.priority).toBe('high');
    });

    it('US 5: Thêm ghi chú ngắn cho Task (notes)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task5');

      const notesContent = 'Nhớ photo 40 bản tài liệu phát cho học sinh lớp 10A1';
      const task = await harness.services.tasks.create({
        title: 'Ôn tập học kỳ',
        date: '2026-11-11',
        category: 'school',
        notes: notesContent,
      });

      expect(task.notes).toBe(notesContent);
    });

    it('US 6: Gắn tối đa 10 Tag cho Task, từ chối > 10 tag', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task6');

      // Tạo 10 tags hợp lệ
      const tags: Tag[] = [];
      for (let i = 1; i <= 10; i++) {
        const t = await harness.services.tags.create({ name: `Tag-${i}`, tone: 'mint' });
        tags.push(t);
      }
      const tagIds = tags.map((t) => t.id);

      const task = await harness.services.tasks.create({
        title: 'Task gắn 10 tags',
        date: '2026-11-12',
        category: 'school',
        tagIds,
      });
      expect(task.tagIds).toHaveLength(10);
      expect(task.tagIds).toEqual(tagIds);

      // Thử tạo tag thứ 11 và gắn cả 11 tags -> ném 400 validation
      const tag11 = await harness.services.tags.create({ name: 'Tag-11', tone: 'rose' });
      const err = await harness.services.tasks
        .create({
          title: 'Task gắn 11 tags',
          date: '2026-11-12',
          category: 'school',
          tagIds: [...tagIds, tag11.id],
        })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('US 7: Tick hoàn thành Task và bỏ tick theo dõi tiến độ', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task7');

      const task = await harness.services.tasks.create({
        title: 'Gửi bảng điểm cho tổ trưởng',
        date: '2026-11-13',
        category: 'school',
      });
      expect(task.completed).toBe(false);

      // Tick hoàn thành
      const completedTask = await harness.services.tasks.update(task.id, { completed: true });
      expect(completedTask.completed).toBe(true);

      // Bỏ tick
      const uncompletedTask = await harness.services.tasks.update(task.id, { completed: false });
      expect(uncompletedTask.completed).toBe(false);
    });

    it('US 8: Sửa và xoá Task cập nhật kế hoạch', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task8');

      const task = await harness.services.tasks.create({
        title: 'Tên ban đầu',
        date: '2026-11-14',
        category: 'school',
      });

      // Sửa task
      const updated = await harness.services.tasks.update(task.id, {
        title: 'Tên đã cập nhật',
        date: '2026-11-15',
        notes: 'Thêm ghi chú',
        priority: 'high',
      });
      expect(updated.title).toBe('Tên đã cập nhật');
      expect(updated.date).toBe('2026-11-15');
      expect(updated.notes).toBe('Thêm ghi chú');
      expect(updated.priority).toBe('high');

      // Xoá task
      await harness.services.tasks.remove(task.id);

      // Task không còn xuất hiện trong danh sách active
      const list = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
      });
      expect(list.items.some((t) => t.id === task.id)).toBe(false);
    });

    it('US 9: Xem Task theo tuần/lưới tháng (khoảng <= 42 ngày), từ chối > 42 ngày', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task9');

      await harness.services.tasks.create({
        title: 'Task trong tuần 1',
        date: '2026-11-03',
        category: 'school',
      });
      await harness.services.tasks.create({
        title: 'Task trong tuần 3',
        date: '2026-11-18',
        category: 'school',
      });

      // Lọc trong tuần 1 (2026-11-01 -> 2026-11-07)
      const week1 = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-07',
      });
      expect(week1.items.some((t) => t.title === 'Task trong tuần 1')).toBe(true);
      expect(week1.items.some((t) => t.title === 'Task trong tuần 3')).toBe(false);

      // Thử khoảng ngày > 42 ngày (ví dụ 45 ngày: 2026-11-01 đến 2026-12-16) -> 400 validation
      const err = await harness.services.tasks
        .list({ from: '2026-11-01', to: '2026-12-16' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('US 10: Tạo Task idempotent khi mất mạng gửi lại cùng id (200 OK với bản hiện có)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Task10');

      const customId = generateClientUuid();
      const payload = {
        id: customId,
        title: 'Task tạo offline',
        date: '2026-11-20',
        category: 'school' as const,
      };

      // Gửi lần đầu -> 201 Created
      const res1 = await harness.client.post<Task>('/tasks', payload);
      expect(res1.status).toBe(201);
      expect(res1.data.id).toBe(customId);
      expect(res1.data.title).toBe('Task tạo offline');

      // Gửi lại cùng id (mô phỏng app kết nối mạng lại gửi lại cùng bản ghi) -> 200 OK
      const res2 = await harness.client.post<Task>('/tasks', {
        ...payload,
        title: 'Task tạo offline - thử gửi lại',
      });
      expect(res2.status).toBe(200);
      expect(res2.data.id).toBe(customId);
      expect(res2.data.title).toBe('Task tạo offline'); // Giữ nguyên bản hiện có

      // Danh sách chỉ có duy nhất 1 bản ghi
      const list = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
      });
      const matches = list.items.filter((t) => t.id === customId);
      expect(matches).toHaveLength(1);
    });
  });

  // ===========================================================================
  // User Stories 11–14: Tags
  // ===========================================================================
  describe('User Stories 11–14: Tags (Nhãn phân loại màu pastel)', () => {
    it('US 11: Tạo Tag với tên và màu pastel', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Tag11');

      const tag = await harness.services.tags.create({
        name: 'Văn học 11',
        tone: 'rose',
      });

      expect(typeof tag.id).toBe('string');
      expect(tag.name).toBe('Văn học 11');
      expect(tag.tone).toBe('rose');
      expect(typeof tag.updatedAt).toBe('string');
    });

    it('US 12: Đổi tên hoặc màu pastel cho Tag', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Tag12');

      const tag = await harness.services.tags.create({ name: 'Hóa 10', tone: 'mint' });
      const updated = await harness.services.tags.update(tag.id, {
        name: 'Hóa học Nâng cao',
        tone: 'lavender',
      });

      expect(updated.name).toBe('Hóa học Nâng cao');
      expect(updated.tone).toBe('lavender');
    });

    it('US 13: Báo lỗi khi tạo/đổi tên Tag trùng tên Tag sẵn có không phân biệt hoa thường (409 tag_name_taken)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Tag13');

      await harness.services.tags.create({ name: 'Địa Lý', tone: 'beige' });

      // Cố tạo tag trùng tên chữ thường 'địa lý' -> 409 tag_name_taken
      const errCreate = await harness.services.tags
        .create({ name: 'địa lý', tone: 'blue' })
        .catch((e: unknown) => e);

      expect(errCreate).toBeInstanceOf(ApiError);
      expect((errCreate as ApiError).status).toBe(409);
      expect((errCreate as ApiError).code).toBe('tag_name_taken');

      // Cố đổi tên tag khác thành 'ĐỊA LÝ' -> 409 tag_name_taken
      const otherTag = await harness.services.tags.create({ name: 'Lịch Sử', tone: 'pink' });
      const errUpdate = await harness.services.tags
        .update(otherTag.id, { name: 'ĐỊA LÝ' })
        .catch((e: unknown) => e);

      expect(errUpdate).toBeInstanceOf(ApiError);
      expect((errUpdate as ApiError).status).toBe(409);
      expect((errUpdate as ApiError).code).toBe('tag_name_taken');
    });

    it('US 14: Xoá Tag tự động gỡ liên kết khỏi mọi Task và Note, cập nhật updatedAt', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Tag14');

      const tag = await harness.services.tags.create({ name: 'Chủ nhiệm', tone: 'pink' });

      const task = await harness.services.tasks.create({
        title: 'Họp ban cán sự lớp',
        date: '2026-11-20',
        category: 'school',
        tagIds: [tag.id],
      });
      const note = await harness.services.notes.create({
        title: 'Ghi chép lớp chủ nhiệm',
        tagIds: [tag.id],
      });

      expect(task.tagIds).toContain(tag.id);
      expect(note.tagIds).toContain(tag.id);

      // Xoá Tag
      await harness.services.tags.remove(tag.id);

      // Kiểm tra Task: tagId đã tự động biến mất
      const taskList = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
      });
      const foundTask = taskList.items.find((t) => t.id === task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask!.tagIds).not.toContain(tag.id);

      // Kiểm tra Note: tagId đã tự động biến mất
      const noteList = await harness.services.notes.list();
      const foundNote = noteList.items.find((n) => n.id === note.id);
      expect(foundNote).toBeDefined();
      expect(foundNote!.tagIds).not.toContain(tag.id);
    });
  });

  // ===========================================================================
  // User Stories 15–23: Notes
  // ===========================================================================
  describe('User Stories 15–23: Notes (Ghi chép, checklist, tìm kiếm không dấu)', () => {
    it('US 15: Tạo Note có tiêu đề, nội dung và checklist', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note15');

      const item1Id = generateClientUuid();
      const note = await harness.services.notes.create({
        title: 'Chuẩn bị đồ dùng thí nghiệm',
        content: 'Thí nghiệm phản ứng este hoá',
        checklist: [{ id: item1Id, text: 'Chuẩn bị ống nghiệm', done: false }],
      });

      expect(typeof note.id).toBe('string');
      expect(note.title).toBe('Chuẩn bị đồ dùng thí nghiệm');
      expect(note.content).toBe('Thí nghiệm phản ứng este hoá');
      expect(note.checklist).toHaveLength(1);
      expect(note.checklist[0].id).toBe(item1Id);
      expect(note.checklist[0].text).toBe('Chuẩn bị ống nghiệm');
      expect(note.checklist[0].done).toBe(false);
      expect(note.completed).toBe(false);
    });

    it('US 16: Tick từng mục checklist trong Note', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note16');

      const id1 = generateClientUuid();
      const id2 = generateClientUuid();
      const note = await harness.services.notes.create({
        title: 'Việc cần làm sáng thứ hai',
        checklist: [
          { id: id1, text: 'Điểm danh chào cờ', done: false },
          { id: id2, text: 'Gặp giáo viên thực tập', done: false },
        ],
      });

      // Tick mục 1
      const updated = await harness.services.notes.update(note.id, {
        checklist: [
          { id: id1, text: 'Điểm danh chào cờ', done: true },
          { id: id2, text: 'Gặp giáo viên thực tập', done: false },
        ],
      });

      expect(updated.checklist.find((i) => i.id === id1)?.done).toBe(true);
      expect(updated.checklist.find((i) => i.id === id2)?.done).toBe(false);
      expect(updated.completed).toBe(false);
    });

    it('US 17: Note tự hoàn thành khi mọi mục checklist đã tick, tự bỏ completed nếu còn mục chưa done', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note17');

      const id1 = generateClientUuid();
      const id2 = generateClientUuid();
      const note = await harness.services.notes.create({
        title: 'Checklist kiểm tra',
        checklist: [
          { id: id1, text: 'Bước 1', done: false },
          { id: id2, text: 'Bước 2', done: false },
        ],
        // Dù client có truyền completed: true, BE vẫn tự tính dựa vào checklist
        completed: true,
      });
      expect(note.completed).toBe(false);

      // Tick tất cả mục done -> note tự chuyển sang completed = true
      const allDone = await harness.services.notes.update(note.id, {
        checklist: [
          { id: id1, text: 'Bước 1', done: true },
          { id: id2, text: 'Bước 2', done: true },
        ],
      });
      expect(allDone.completed).toBe(true);

      // Bỏ tick 1 mục -> note tự completed = false
      const unDoneOne = await harness.services.notes.update(note.id, {
        checklist: [
          { id: id1, text: 'Bước 1', done: true },
          { id: id2, text: 'Bước 2', done: false },
        ],
      });
      expect(unDoneOne.completed).toBe(false);
    });

    it('US 18: Tự đánh dấu hoàn thành cho Note không có checklist', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note18');

      // Note không checklist khởi tạo completed: true
      const note = await harness.services.notes.create({
        title: 'Ghi nhớ nhanh',
        checklist: [],
        completed: true,
      });
      expect(note.completed).toBe(true);

      // Đổi thành false
      const updated = await harness.services.notes.update(note.id, { completed: false });
      expect(updated.completed).toBe(false);
    });

    it('US 19: Đặt hạn hoàn thành cho Note (dueDate)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note19');

      const note = await harness.services.notes.create({
        title: 'Nộp kế hoạch dạy bù',
        dueDate: '2026-11-25',
      });
      expect(note.dueDate).toBe('2026-11-25');

      const updated = await harness.services.notes.update(note.id, { dueDate: '2026-11-30' });
      expect(updated.dueDate).toBe('2026-11-30');
    });

    it('US 20: Gắn Tag cho Note và lọc Note theo Tag', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note20');

      const tagA = await harness.services.tags.create({ name: 'Chuyên đề 1', tone: 'blue' });
      const tagB = await harness.services.tags.create({ name: 'Chuyên đề 2', tone: 'mint' });

      const note1 = await harness.services.notes.create({
        title: 'Note môn A',
        tagIds: [tagA.id],
      });
      const note2 = await harness.services.notes.create({
        title: 'Note môn B',
        tagIds: [tagB.id],
      });

      const listTagA = await harness.services.notes.list({ tagId: tagA.id });
      expect(listTagA.items.some((n) => n.id === note1.id)).toBe(true);
      expect(listTagA.items.some((n) => n.id === note2.id)).toBe(false);
    });

    it('US 21: Tìm Note bằng tiếng Việt không dấu (q)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note21');

      const note = await harness.services.notes.create({
        title: 'Kế hoạch Ôn tập giữa kỳ I',
        content: 'Tài liệu hướng dẫn giải bài tập nâng cao',
      });

      // Tìm 'on tap' (không dấu) phải tìm thấy 'Ôn tập'
      const searchNoAccent = await harness.services.notes.list({ q: 'on tap' });
      expect(searchNoAccent.items.some((n) => n.id === note.id)).toBe(true);

      // Tìm 'nang cao' phải tìm thấy trong content
      const searchContent = await harness.services.notes.list({ q: 'nang cao' });
      expect(searchContent.items.some((n) => n.id === note.id)).toBe(true);

      // Tìm từ khoá không khớp
      const searchNonMatch = await harness.services.notes.list({ q: 'khongcotrongbai' });
      expect(searchNonMatch.items.some((n) => n.id === note.id)).toBe(false);
    });

    it('US 22: Phân trang cursor cho danh sách Note (nextCursor)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note22');

      // Tạo 3 notes
      const n1 = await harness.services.notes.create({ title: 'Note phân trang 1' });
      const n2 = await harness.services.notes.create({ title: 'Note phân trang 2' });
      const n3 = await harness.services.notes.create({ title: 'Note phân trang 3' });

      // Trang 1 lấy limit 2
      const page1 = await harness.services.notes.list({ limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.nextCursor).toBeDefined();
      expect(typeof page1.nextCursor).toBe('string');

      // Trang 2 dùng cursor từ trang 1
      const page2 = await harness.services.notes.list({ limit: 2, cursor: page1.nextCursor! });
      expect(page2.items.length).toBeGreaterThanOrEqual(1);

      // Đảm bảo không trùng id giữa page1 và page2
      const page1Ids = page1.items.map((i) => i.id);
      for (const item of page2.items) {
        expect(page1Ids).not.toContain(item.id);
      }

      const allFetchedIds = [...page1Ids, ...page2.items.map((i) => i.id)];
      expect(allFetchedIds).toContain(n1.id);
      expect(allFetchedIds).toContain(n2.id);
      expect(allFetchedIds).toContain(n3.id);
    });

    it('US 23: Sửa và xoá Note', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Note23');

      const note = await harness.services.notes.create({
        title: 'Note sắp xoá',
        content: 'Nội dung cũ',
      });

      const updated = await harness.services.notes.update(note.id, {
        title: 'Note cập nhật',
        content: 'Nội dung mới',
      });
      expect(updated.title).toBe('Note cập nhật');
      expect(updated.content).toBe('Nội dung mới');

      await harness.services.notes.remove(note.id);

      const list = await harness.services.notes.list();
      expect(list.items.some((n) => n.id === note.id)).toBe(false);
    });
  });

  // ===========================================================================
  // User Stories 24–26: Đồng bộ Mobile-First
  // ===========================================================================
  describe('User Stories 24–26: Đồng bộ Mobile-First (Delta Sync & Multi-device)', () => {
    it('US 24: Tải chỉ phần thay đổi kể từ lần trước qua updatedSince (items & deletedIds)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Sync24');

      const taskToKeep = await harness.services.tasks.create({
        title: 'Task giữ lại',
        date: '2026-11-20',
        category: 'school',
      });
      const taskToDelete = await harness.services.tasks.create({
        title: 'Task sẽ xoá',
        date: '2026-11-20',
        category: 'school',
      });

      // Lấy checkpoint thời điểm hiện tại từ server
      const initial = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
      });
      const checkpoint = initial.serverTime;

      // Chờ một chút để timestamp mới lớn hơn checkpoint
      await new Promise((r) => setTimeout(r, 60));

      // Thực hiện thay đổi: sửa 1 task, xoá 1 task
      await harness.services.tasks.update(taskToKeep.id, { title: 'Task giữ lại (đã sửa)' });
      await harness.services.tasks.remove(taskToDelete.id);

      // Delta sync với updatedSince = checkpoint
      const delta = await harness.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
        updatedSince: checkpoint,
      });

      // items chỉ chứa task vừa sửa
      expect(delta.items.some((t) => t.id === taskToKeep.id)).toBe(true);
      expect(delta.items.find((t) => t.id === taskToKeep.id)?.title).toBe('Task giữ lại (đã sửa)');
      // deletedIds chứa id của task vừa xoá
      expect(delta.deletedIds).toContain(taskToDelete.id);

      // updatedSince cũ hơn 30 ngày -> 400 validation
      const oldDate = new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString();
      const err = await harness.services.tasks
        .list({ from: '2026-11-01', to: '2026-11-30', updatedSince: oldDate })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('US 25: Kịch bản hai thiết bị của cùng giáo viên đồng bộ thay đổi và xoá', async () => {
      if (!beAvailable) return;
      const { harness: device1, email } = await createOnboardedTeacher('TwoDev');

      // Thiết bị 2 đăng nhập cùng tài khoản giáo viên
      const device2 = createTestClient({ baseURL: BE_URL, ip: getNextTestIp() });
      const dev2Session = await device2.services.auth.login({ email, password: 'Password123' });
      device2.setToken(dev2Session.accessToken);

      // Device 2 lấy trạng thái ban đầu
      const initialTags = await device2.services.tags.list();
      const dev2Checkpoint = initialTags.serverTime;

      await new Promise((r) => setTimeout(r, 60));

      // Device 1 tạo 1 tag mới và 1 note mới
      const newTag = await device1.services.tags.create({ name: 'Tin học 12', tone: 'mint' });
      const newNote = await device1.services.notes.create({ title: 'Ghi chú phòng máy' });

      // Device 2 sync tag với checkpoint cũ -> nhận được tag mới của Device 1
      const dev2TagSync = await device2.services.tags.list(dev2Checkpoint);
      expect(dev2TagSync.items.some((t) => t.id === newTag.id)).toBe(true);

      // Device 1 xoá tag này
      await device1.services.tags.remove(newTag.id);

      // Device 2 sync lại -> nhận được newTag.id trong deletedIds
      const dev2TagSyncAfterDelete = await device2.services.tags.list(dev2TagSync.serverTime);
      expect(dev2TagSyncAfterDelete.deletedIds).toContain(newTag.id);

      // Device 2 kiểm tra note
      const dev2Notes = await device2.services.notes.list();
      expect(dev2Notes.items.some((n) => n.id === newNote.id)).toBe(true);
    });

    it('US 26: Thao tác offline với bản ghi đã bị xoá ở thiết bị khác (PATCH 404, POST retry 410 gone)', async () => {
      if (!beAvailable) return;
      const { harness: device1, email } = await createOnboardedTeacher('OfflineDel');

      const device2 = createTestClient({ baseURL: BE_URL, ip: getNextTestIp() });
      const session2 = await device2.services.auth.login({ email, password: 'Password123' });
      device2.setToken(session2.accessToken);

      // Tạo một task ban đầu
      const task = await device1.services.tasks.create({
        title: 'Task kiểm tra offline delete',
        date: '2026-11-22',
        category: 'school',
      });

      // Device 1 xoá task trên server
      await device1.services.tasks.remove(task.id);

      // Device 2 (đang offline nên chưa biết task đã bị xoá) cố cập nhật Task này -> 404 not_found
      const errPatch = await device2.services.tasks
        .update(task.id, { title: 'Device 2 cố sửa' })
        .catch((e: unknown) => e);

      expect(errPatch).toBeInstanceOf(ApiError);
      expect((errPatch as ApiError).status).toBe(404);
      expect((errPatch as ApiError).code).toBe('not_found');

      // Device 2 gửi lại POST với đúng id đã bị xoá mềm -> 410 gone
      const errPost = await device2.client
        .post('/tasks', {
          id: task.id,
          title: 'Device 2 gửi lại bản ghi đã bị xoá mềm',
          date: '2026-11-22',
          category: 'school',
        })
        .catch((e: unknown) => e);

      expect(errPost).toBeInstanceOf(ApiError);
      expect((errPost as ApiError).status).toBe(410);
      expect((errPost as ApiError).code).toBe('gone');
    });
  });

  // ===========================================================================
  // User Story 27: Inspiration
  // ===========================================================================
  describe('User Story 27: Daily Inspiration (Câu truyền cảm hứng mỗi ngày)', () => {
    it('US 27: GET /inspirations/today trả về câu trích dẫn vi/en theo ngày', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Insp27');

      const inspiration = await harness.services.inspirations.today();

      expect(typeof inspiration.id).toBe('string');
      expect(inspiration.quote).toBeDefined();
      expect(typeof inspiration.quote.vi).toBe('string');
      expect(inspiration.quote.vi.length).toBeGreaterThan(0);
      expect(typeof inspiration.quote.en).toBe('string');
      expect(inspiration.quote.en.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // User Stories 28–30: Settings
  // ===========================================================================
  describe('User Stories 28–30: Settings (Cài đặt ngôn ngữ, múi giờ, thông báo)', () => {
    it('US 28: Lưu và đồng bộ ngôn ngữ vi/en sang mọi thiết bị', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Set28');

      // Settings ban đầu
      const initial = await harness.services.settings.get();
      expect(['vi', 'en']).toContain(initial.locale);

      // Đổi sang 'en'
      const updated = await harness.services.settings.update({ locale: 'en' });
      expect(updated.locale).toBe('en');

      // Đọc lại từ GET /me/settings
      const fetched = await harness.services.settings.get();
      expect(fetched.locale).toBe('en');
    });

    it('US 29: Lưu múi giờ IANA, từ chối múi giờ không hợp lệ (400 validation)', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Set29');

      // Cập nhật múi giờ IANA hợp lệ
      const updated = await harness.services.settings.update({ timeZone: 'America/New_York' });
      expect(updated.timeZone).toBe('America/New_York');

      // Thử múi giờ không hợp lệ -> 400 validation
      const err = await harness.services.settings
        .update({ timeZone: 'Invalid/Non_Existent_Zone' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('US 30: Bật/tắt thông báo và cấu hình nhắc trước 5/10/15/30/60 phút', async () => {
      if (!beAvailable) return;
      const { harness } = await createOnboardedTeacher('Set30');

      // Bật/tắt pushEnabled và chọn reminderLeadMinutes
      const updated = await harness.services.settings.update({
        pushEnabled: false,
        reminderLeadMinutes: 30,
      });
      expect(updated.pushEnabled).toBe(false);
      expect(updated.reminderLeadMinutes).toBe(30);

      // Thử reminderLeadMinutes không nằm trong danh sách [5, 10, 15, 30, 60] -> 400 validation
      const err = await harness.services.settings
        // @ts-expect-error test runtime validation
        .update({ reminderLeadMinutes: 45 })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });
  });

  // ===========================================================================
  // User Story 31: Bảo mật & Cô lập dữ liệu giữa các giáo viên
  // ===========================================================================
  describe('User Story 31: Bảo mật và cô lập dữ liệu giữa các giáo viên', () => {
    it('Giáo viên A không thể xem, sửa, xoá dữ liệu của Giáo viên B (404 not_found)', async () => {
      if (!beAvailable) return;
      const { harness: teacherA } = await createOnboardedTeacher('SecTeacherA');
      const { harness: teacherB } = await createOnboardedTeacher('SecTeacherB');

      // Teacher B tạo Task, Tag, Note
      const taskB = await teacherB.services.tasks.create({
        title: 'Task bí mật của B',
        date: '2026-11-25',
        category: 'personal',
      });
      const tagB = await teacherB.services.tags.create({ name: 'Nhãn riêng của B', tone: 'rose' });
      const noteB = await teacherB.services.notes.create({ title: 'Ghi chú riêng của B' });

      // Teacher A gọi list -> không thấy bất kỳ tài nguyên nào của Teacher B
      const listTasksA = await teacherA.services.tasks.list({
        from: '2026-11-01',
        to: '2026-11-30',
      });
      expect(listTasksA.items.some((t) => t.id === taskB.id)).toBe(false);

      const listTagsA = await teacherA.services.tags.list();
      expect(listTagsA.items.some((t) => t.id === tagB.id)).toBe(false);

      const listNotesA = await teacherA.services.notes.list();
      expect(listNotesA.items.some((n) => n.id === noteB.id)).toBe(false);

      // Teacher A cố sửa Task của Teacher B -> 404 not_found
      const errPatchTask = await teacherA.services.tasks
        .update(taskB.id, { title: 'Teacher A cố hack' })
        .catch((e: unknown) => e);
      expect(errPatchTask).toBeInstanceOf(ApiError);
      expect((errPatchTask as ApiError).status).toBe(404);
      expect((errPatchTask as ApiError).code).toBe('not_found');

      // Teacher A cố xoá Task của Teacher B -> 404 not_found
      const errDeleteTask = await teacherA.services.tasks.remove(taskB.id).catch((e: unknown) => e);
      expect(errDeleteTask).toBeInstanceOf(ApiError);
      expect((errDeleteTask as ApiError).status).toBe(404);
      expect((errDeleteTask as ApiError).code).toBe('not_found');

      // Teacher A cố sửa Tag của Teacher B -> 404 not_found
      const errPatchTag = await teacherA.services.tags
        .update(tagB.id, { name: 'Đổi tên trộm' })
        .catch((e: unknown) => e);
      expect(errPatchTag).toBeInstanceOf(ApiError);
      expect((errPatchTag as ApiError).status).toBe(404);
      expect((errPatchTag as ApiError).code).toBe('not_found');

      // Teacher A cố xoá Tag của Teacher B -> 404 not_found
      const errDeleteTag = await teacherA.services.tags.remove(tagB.id).catch((e: unknown) => e);
      expect(errDeleteTag).toBeInstanceOf(ApiError);
      expect((errDeleteTag as ApiError).status).toBe(404);
      expect((errDeleteTag as ApiError).code).toBe('not_found');

      // Teacher A cố sửa Note của Teacher B -> 404 not_found
      const errPatchNote = await teacherA.services.notes
        .update(noteB.id, { title: 'Đọc trộm ghi chú' })
        .catch((e: unknown) => e);
      expect(errPatchNote).toBeInstanceOf(ApiError);
      expect((errPatchNote as ApiError).status).toBe(404);
      expect((errPatchNote as ApiError).code).toBe('not_found');

      // Teacher A cố xoá Note của Teacher B -> 404 not_found
      const errDeleteNote = await teacherA.services.notes.remove(noteB.id).catch((e: unknown) => e);
      expect(errDeleteNote).toBeInstanceOf(ApiError);
      expect((errDeleteNote as ApiError).status).toBe(404);
      expect((errDeleteNote as ApiError).code).toBe('not_found');
    });

    it('Giáo viên A không thể gắn Tag của Giáo viên B vào Task/Note của mình (400 validation)', async () => {
      if (!beAvailable) return;
      const { harness: teacherA } = await createOnboardedTeacher('SecTagA');
      const { harness: teacherB } = await createOnboardedTeacher('SecTagB');

      const tagB = await teacherB.services.tags.create({ name: 'Tag của B', tone: 'mint' });

      // Teacher A cố gắn tagB vào Task của mình -> 400 validation
      const errTask = await teacherA.services.tasks
        .create({
          title: 'Task của A gắn trộm tag của B',
          date: '2026-11-26',
          category: 'school',
          tagIds: [tagB.id],
        })
        .catch((e: unknown) => e);

      expect(errTask).toBeInstanceOf(ApiError);
      expect((errTask as ApiError).status).toBe(400);
      expect((errTask as ApiError).code).toBe('validation');

      // Teacher A cố gắn tagB vào Note của mình -> 400 validation
      const errNote = await teacherA.services.notes
        .create({
          title: 'Note của A gắn trộm tag của B',
          tagIds: [tagB.id],
        })
        .catch((e: unknown) => e);

      expect(errNote).toBeInstanceOf(ApiError);
      expect((errNote as ApiError).status).toBe(400);
      expect((errNote as ApiError).code).toBe('validation');
    });

    it('Giáo viên A không thể tạo tài nguyên với id trùng với tài nguyên của Giáo viên B (409 id_conflict)', async () => {
      if (!beAvailable) return;
      const { harness: teacherA } = await createOnboardedTeacher('SecIdA');
      const { harness: teacherB } = await createOnboardedTeacher('SecIdB');

      const taskB = await teacherB.services.tasks.create({
        title: 'Task của B',
        date: '2026-11-27',
        category: 'school',
      });

      // Teacher A cố gửi POST /tasks với id trùng với taskB.id -> 409 id_conflict
      const errTask = await teacherA.client
        .post('/tasks', {
          id: taskB.id,
          title: 'A cố chiếm id của B',
          date: '2026-11-27',
          category: 'school',
        })
        .catch((e: unknown) => e);

      expect(errTask).toBeInstanceOf(ApiError);
      expect((errTask as ApiError).status).toBe(409);
      expect((errTask as ApiError).code).toBe('id_conflict');
    });
  });
});
