import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { createPushService } from './push.service';

describe('pushService', () => {
  const createMockHttp = () => {
    return {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
  };

  describe('getVapidPublicKey', () => {
    it('requests GET /push/vapid-public-key and returns publicKey', async () => {
      const http = createMockHttp();
      vi.mocked(http.get).mockResolvedValueOnce({ data: { publicKey: 'test-public-key' } });

      const service = createPushService(http);
      const result = await service.getVapidPublicKey();

      expect(http.get).toHaveBeenCalledWith('/push/vapid-public-key');
      expect(result).toEqual({ publicKey: 'test-public-key' });
    });
  });

  describe('createPushSubscription', () => {
    it('posts to /push/subscriptions with payload and returns created subscription', async () => {
      const http = createMockHttp();
      const payload = {
        endpoint: 'https://push.example.com/sub/123',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: payload });

      const service = createPushService(http);
      const result = await service.createPushSubscription(payload);

      expect(http.post).toHaveBeenCalledWith('/push/subscriptions', payload);
      expect(result).toEqual(payload);
    });

    it('createSubscription alias behaves identically', async () => {
      const http = createMockHttp();
      const payload = {
        endpoint: 'https://push.example.com/sub/123',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: payload });

      const service = createPushService(http);
      const result = await service.createSubscription(payload);

      expect(http.post).toHaveBeenCalledWith('/push/subscriptions', payload);
      expect(result).toEqual(payload);
    });
  });

  describe('deletePushSubscription', () => {
    it('sends DELETE /push/subscriptions with endpoint in request body data', async () => {
      const http = createMockHttp();
      const payload = { endpoint: 'https://push.example.com/sub/123' };
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      const service = createPushService(http);
      await service.deletePushSubscription(payload);

      expect(http.delete).toHaveBeenCalledWith('/push/subscriptions', { data: payload });
    });

    it('deleteSubscription alias behaves identically', async () => {
      const http = createMockHttp();
      const payload = { endpoint: 'https://push.example.com/sub/123' };
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      const service = createPushService(http);
      await service.deleteSubscription(payload);

      expect(http.delete).toHaveBeenCalledWith('/push/subscriptions', { data: payload });
    });
  });
});
