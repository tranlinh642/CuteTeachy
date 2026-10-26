import { describe, expect, it } from 'vitest';
import type { TaskCategory } from '@/types';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { MOCK_DEMO_CREDENTIALS } from '../seed/user.seed';

const setup = () => {
  let token: string | null = null;
  const services = createServices(
    createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => token,
      getLocale: () => 'vi',
      onUnauthorized: () => undefined,
    }),
  );
  return { services, setToken: (value: string) => (token = value) };
};

describe('Task Mock Handler (SPEC-003 Contract)', () => {
  const validUuid1 = '11111111-1111-4111-8111-111111111111';
  const validUuid2 = '22222222-2222-4222-8222-222222222222';

  describe('GET /tasks?from&to[&updatedSince]', () => {
    it('returns 400 validation if from or to is missing', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(services.tasks.list()).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });

      await expect(services.tasks.list({ from: '2026-10-01' })).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });
    });

    it('returns 400 validation if date format is invalid or invalid calendar date', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(services.tasks.list({ from: '2026/10/01', to: '2026-10-10' })).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });

      await expect(services.tasks.list({ from: '2026-02-30', to: '2026-03-05' })).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });
    });

    it('returns 400 validation if from date is after to date', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(services.tasks.list({ from: '2026-10-20', to: '2026-10-10' })).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });
    });

    it('returns 400 validation if date range exceeds 42 days', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      // 43 days
      await expect(services.tasks.list({ from: '2026-10-01', to: '2026-11-13' })).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });
    });

    it('returns 400 validation if updatedSince is older than 30 days', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const oldCheckpoint = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
      await expect(
        services.tasks.list({ from: '2026-10-01', to: '2026-10-31', updatedSince: oldCheckpoint }),
      ).rejects.toMatchObject({
        status: 400,
        code: 'validation',
      });
    });

    it('returns 200 envelope with tasks matching date range', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const created = await services.tasks.create({
        id: validUuid1,
        title: 'Kiểm tra 15 phút',
        date: '2026-10-15',
        category: 'school',
      });

      const envelope = await services.tasks.list({ from: '2026-10-10', to: '2026-10-20' });
      expect(envelope.items.some((t) => t.id === created.id)).toBe(true);
      expect(envelope.deletedIds).toEqual([]);
      expect(typeof envelope.serverTime).toBe('string');
    });

    it('returns delta changes and deletedIds when updatedSince is provided', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const task1 = await services.tasks.create({
        id: validUuid1,
        title: 'Task A',
        date: '2026-10-15',
        category: 'school',
      });

      const task2 = await services.tasks.create({
        id: validUuid2,
        title: 'Task B sẽ xoá',
        date: '2026-10-16',
        category: 'personal',
      });

      const initial = await services.tasks.list({ from: '2026-10-10', to: '2026-10-20' });
      const checkpoint = initial.serverTime;

      // Small delay for timestamp differentiation
      await new Promise((r) => setTimeout(r, 10));

      // Update task1
      await services.tasks.update(task1.id, { completed: true });

      // Delete task2
      await services.tasks.remove(task2.id);

      const delta = await services.tasks.list({
        from: '2026-10-10',
        to: '2026-10-20',
        updatedSince: checkpoint,
      });

      expect(delta.items.some((t) => t.id === task1.id && t.completed === true)).toBe(true);
      expect(delta.deletedIds).toContain(task2.id);
    });
  });

  describe('POST /tasks (Creation & Idempotency)', () => {
    it('returns 400 validation when title or date or category is invalid', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      // Empty title
      await expect(
        services.tasks.create({ id: validUuid1, title: '', date: '2026-10-15', category: 'school' }),
      ).rejects.toMatchObject({ status: 400, code: 'validation' });

      // Invalid time format
      await expect(
        services.tasks.create({
          id: validUuid1,
          title: 'Họp',
          date: '2026-10-15',
          time: '25:00',
          category: 'school',
        }),
      ).rejects.toMatchObject({ status: 400, code: 'validation' });

      // Invalid category
      await expect(
        services.tasks.create({
          id: validUuid1,
          title: 'Họp',
          date: '2026-10-15',
          category: 'invalid' as unknown as TaskCategory,
        }),
      ).rejects.toMatchObject({ status: 400, code: 'validation' });
    });

    it('returns 400 validation if tagId does not exist or is soft-deleted', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(
        services.tasks.create({
          id: validUuid1,
          title: 'Việc kèm tag lạ',
          date: '2026-10-15',
          category: 'school',
          tagIds: ['00000000-0000-4000-8000-000000000000'],
        }),
      ).rejects.toMatchObject({ status: 400, code: 'validation' });
    });

    it('returns 201 Created and auto-generates client UUID if none provided', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const created = await services.tasks.create({
        title: 'Giao bài tập',
        date: '2026-10-15',
        category: 'school',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Giao bài tập');
      expect(created.completed).toBe(false);
      expect(created.priority).toBe('normal');
    });

    it('returns 200 OK on duplicate creation with same UUID (idempotent)', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const first = await services.tasks.create({
        id: validUuid1,
        title: 'Task ban đầu',
        date: '2026-10-15',
        category: 'school',
      });

      const second = await services.tasks.create({
        id: validUuid1,
        title: 'Task gửi lại sau khi mất mạng',
        date: '2026-10-16',
        category: 'personal',
      });

      expect(second.id).toBe(first.id);
      expect(second.title).toBe('Task ban đầu'); // Original kept
    });

    it('returns 410 gone when attempting to create a task on a soft-deleted UUID', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const task = await services.tasks.create({
        id: validUuid1,
        title: 'Task sắp xoá',
        date: '2026-10-15',
        category: 'school',
      });

      await services.tasks.remove(task.id);

      await expect(
        services.tasks.create({
          id: validUuid1,
          title: 'Tạo lại trên ID đã xoá',
          date: '2026-10-15',
          category: 'school',
        }),
      ).rejects.toMatchObject({
        status: 410,
        code: 'gone',
      });
    });
  });

  describe('PATCH /tasks/:id (Partial Update)', () => {
    it('returns 404 not_found when updating non-existent task', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(
        services.tasks.update('99999999-9999-4999-8999-999999999999', { title: 'Sửa' }),
      ).rejects.toMatchObject({ status: 404, code: 'not_found' });
    });

    it('returns 404 not_found when updating soft-deleted task', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const task = await services.tasks.create({
        id: validUuid1,
        title: 'Task xoá',
        date: '2026-10-15',
        category: 'school',
      });

      await services.tasks.remove(task.id);

      await expect(services.tasks.update(task.id, { completed: true })).rejects.toMatchObject({
        status: 404,
        code: 'not_found',
      });
    });

    it('updates fields and refreshes updatedAt', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const task = await services.tasks.create({
        id: validUuid1,
        title: 'Tiêu đề cũ',
        date: '2026-10-15',
        category: 'school',
      });

      const updated = await services.tasks.update(task.id, {
        title: 'Tiêu đề mới',
        priority: 'high',
        completed: true,
      });

      expect(updated.title).toBe('Tiêu đề mới');
      expect(updated.priority).toBe('high');
      expect(updated.completed).toBe(true);
    });
  });

  describe('DELETE /tasks/:id (Soft-delete & Idempotency)', () => {
    it('soft deletes task and repeated delete returns 204 (idempotent)', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      const task = await services.tasks.create({
        id: validUuid1,
        title: 'Task để xoá',
        date: '2026-10-15',
        category: 'school',
      });

      // First delete -> succeeds
      await expect(services.tasks.remove(task.id)).resolves.toBeUndefined();

      // Repeated delete -> succeeds with 204
      await expect(services.tasks.remove(task.id)).resolves.toBeUndefined();
    });

    it('returns 404 when deleting a non-existent task that was never in DB', async () => {
      const { services, setToken } = setup();
      const session = await services.auth.login(MOCK_DEMO_CREDENTIALS);
      setToken(session.accessToken);

      await expect(services.tasks.remove('88888888-8888-4888-8888-888888888888')).rejects.toMatchObject({
        status: 404,
        code: 'not_found',
      });
    });
  });
});
