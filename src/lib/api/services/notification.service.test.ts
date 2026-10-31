import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { createNotificationService } from './notification.service';

describe('notificationService (S6-FE-02)', () => {
  const createMockHttp = () => {
    return {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    } as unknown as AxiosInstance;
  };

  describe('list', () => {
    it('requests GET /notifications with optional params and returns { items, unreadCount }', async () => {
      const http = createMockHttp();
      const mockResponse = {
        items: [
          {
            id: 'notif-1',
            accountId: 'u-1',
            type: 'task' as const,
            targetId: 'task-1',
            title: 'Nhắc nhở công việc: Chấm bài',
            body: '08:00',
            url: '/calendar?date=2026-10-29',
            data: { type: 'task', id: 'task-1' },
            readAt: null,
            createdAt: '2026-10-29T00:45:00.000Z',
          },
        ],
        unreadCount: 1,
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockResponse });

      const service = createNotificationService(http);
      const result = await service.list({ unreadOnly: true, limit: 10 });

      expect(http.get).toHaveBeenCalledWith('/notifications', {
        params: { unreadOnly: true, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('requests GET /notifications without params when none provided', async () => {
      const http = createMockHttp();
      const mockResponse = { items: [], unreadCount: 0 };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockResponse });

      const service = createNotificationService(http);
      const result = await service.list();

      expect(http.get).toHaveBeenCalledWith('/notifications', { params: undefined });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markRead', () => {
    it('sends PATCH /notifications/:id/read and returns updated notification', async () => {
      const http = createMockHttp();
      const updated = {
        id: 'notif-1',
        accountId: 'u-1',
        type: 'task' as const,
        targetId: 'task-1',
        title: 'Nhắc nhở công việc: Chấm bài',
        body: '08:00',
        url: '/calendar?date=2026-10-29',
        data: null,
        readAt: '2026-10-29T01:00:00.000Z',
        createdAt: '2026-10-29T00:45:00.000Z',
      };
      vi.mocked(http.patch).mockResolvedValueOnce({ data: updated });

      const service = createNotificationService(http);
      const result = await service.markRead('notif-1');

      expect(http.patch).toHaveBeenCalledWith('/notifications/notif-1/read');
      expect(result).toEqual(updated);
    });
  });

  describe('markAllRead', () => {
    it('sends POST /notifications/read-all and returns { updatedCount }', async () => {
      const http = createMockHttp();
      vi.mocked(http.post).mockResolvedValueOnce({ data: { updatedCount: 3 } });

      const service = createNotificationService(http);
      const result = await service.markAllRead();

      expect(http.post).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toEqual({ updatedCount: 3 });
    });
  });
});
