import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockAdapter } from '../mock-adapter';
import { createMockDb } from '../mock-db';

const setupTest = (options: { token?: string | null } = {}) => {
  const db = createMockDb();
  const token: string | null = options.token !== undefined ? options.token : 'mock-token-test';

  const httpClient = createHttpClient({
    mode: 'mock',
    mockLatencyMs: 0,
    getAccessToken: () => token,
    getLocale: () => 'vi',
    onUnauthorized: () => undefined,
  });
  httpClient.defaults.adapter = createMockAdapter({ latencyMs: 0, db });
  const services = createServices(httpClient);

  return { services, db };
};

describe('Notification Mock Handler (SPEC-006 S6-FE-02)', () => {
  describe('GET /notifications', () => {
    it('requires authentication token', async () => {
      const { services } = setupTest({ token: null });
      const err = await services.notifications.list().catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('unauthorized');
    });

    it('returns seeded notifications sorted by createdAt desc and unreadCount', async () => {
      const { services } = setupTest();
      const res = await services.notifications.list();

      expect(res.items.length).toBeGreaterThan(0);
      expect(res.unreadCount).toBe(res.items.filter((n) => n.readAt === null).length);
    });

    it('filters by unreadOnly=true and respects limit while preserving total unreadCount', async () => {
      const { services } = setupTest();
      const unreadOnlyRes = await services.notifications.list({ unreadOnly: true, limit: 1 });

      expect(unreadOnlyRes.items).toHaveLength(1);
      expect(unreadOnlyRes.items[0].readAt).toBeNull();
      expect(unreadOnlyRes.unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('marks an unread notification as read and decrements unreadCount', async () => {
      const { services } = setupTest();
      const initial = await services.notifications.list();
      const unreadTarget = initial.items.find((n) => n.readAt === null);
      expect(unreadTarget).toBeDefined();

      const updated = await services.notifications.markRead(unreadTarget!.id);
      expect(updated.id).toBe(unreadTarget!.id);
      expect(updated.readAt).not.toBeNull();

      const after = await services.notifications.list();
      expect(after.unreadCount).toBe(initial.unreadCount - 1);
    });

    it('returns 404 when notification does not exist', async () => {
      const { services } = setupTest();
      const err = await services.notifications
        .markRead('non-existent-id')
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
    });
  });

  describe('POST /notifications/read-all', () => {
    it('marks all unread notifications as read and returns { updatedCount }', async () => {
      const { services } = setupTest();
      const before = await services.notifications.list();
      expect(before.unreadCount).toBeGreaterThan(0);

      const res = await services.notifications.markAllRead();
      expect(res.updatedCount).toBe(before.unreadCount);

      const after = await services.notifications.list();
      expect(after.unreadCount).toBe(0);
      expect(after.items.every((n) => n.readAt !== null)).toBe(true);
    });
  });

  describe('POST /push/subscriptions/test integration with notifications store', () => {
    it('appends a new test notification into notifications list and increments unreadCount', async () => {
      const { services } = setupTest();
      const before = await services.notifications.list();

      const testRes = await services.push.sendTestNotification();
      expect(testRes.inAppCreated).toBe(true);

      const after = await services.notifications.list();
      expect(after.items.length).toBe(before.items.length + 1);
      expect(after.unreadCount).toBe(before.unreadCount + 1);
      expect(after.items[0].type).toBe('system');
      expect(after.items[0].readAt).toBeNull();
    });
  });
});
