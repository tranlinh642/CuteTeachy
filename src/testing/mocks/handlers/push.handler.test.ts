import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockAdapter } from '../mock-adapter';
import { createMockDb } from '../mock-db';

const setupTest = (options: { token?: string | null } = {}) => {
  const db = createMockDb();
  let token: string | null = options.token !== undefined ? options.token : 'mock-token-test';

  const httpClient = createHttpClient({
    mode: 'mock',
    mockLatencyMs: 0,
    getAccessToken: () => token,
    getLocale: () => 'vi',
    onUnauthorized: () => undefined,
  });
  httpClient.defaults.adapter = createMockAdapter({ latencyMs: 0, db });
  const services = createServices(httpClient);

  return { services, db, httpClient, setToken: (t: string | null) => (token = t) };
};

describe('Push Mock Handler (SPEC-005 & S5-FE-01)', () => {
  describe('GET /push/vapid-public-key', () => {
    it('returns 200 with publicKey without requiring auth token (public route)', async () => {
      const { services } = setupTest({ token: null });
      const result = await services.push.getVapidPublicKey();

      expect(result).toEqual({ publicKey: 'mock-vapid-public-key' });
    });
  });

  describe('POST /push/subscriptions', () => {
    it('requires authentication token', async () => {
      const { services } = setupTest({ token: null });

      const err = await services.push
        .createPushSubscription({
          endpoint: 'https://push.example.com/sub/1',
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe('unauthorized');
    });

    it('creates new push subscription and returns 201', async () => {
      const { services, db } = setupTest();
      const payload = {
        endpoint: 'https://push.example.com/sub/1',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      };

      const result = await services.push.createPushSubscription(payload);

      expect(result).toEqual(payload);
      expect(db.pushSubscriptions).toHaveLength(1);
      expect(db.pushSubscriptions?.[0]).toEqual(payload);
    });

    it('updates existing subscription with same endpoint (upsert, 200 OK)', async () => {
      const { services, db } = setupTest();
      const initial = {
        endpoint: 'https://push.example.com/sub/1',
        keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
      };
      await services.push.createPushSubscription(initial);

      const updated = {
        endpoint: 'https://push.example.com/sub/1',
        keys: { p256dh: 'p256dh-2', auth: 'auth-2' },
      };
      const result = await services.push.createPushSubscription(updated);

      expect(result).toEqual(updated);
      expect(db.pushSubscriptions).toHaveLength(1);
      expect(db.pushSubscriptions?.[0]).toEqual(updated);
    });

    it('rejects invalid payload without keys or endpoint with 400 validation error', async () => {
      const { services } = setupTest();

      const err = await services.push
        .createPushSubscription({
          endpoint: '',
          keys: { p256dh: '', auth: '' },
        })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });
  });

  describe('DELETE /push/subscriptions', () => {
    it('removes matching subscription by endpoint and returns 204 no content', async () => {
      const { services, db } = setupTest();
      await services.push.createPushSubscription({
        endpoint: 'https://push.example.com/sub/1',
        keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
      });
      await services.push.createPushSubscription({
        endpoint: 'https://push.example.com/sub/2',
        keys: { p256dh: 'p256dh-2', auth: 'auth-2' },
      });
      expect(db.pushSubscriptions).toHaveLength(2);

      await services.push.deletePushSubscription({ endpoint: 'https://push.example.com/sub/1' });

      expect(db.pushSubscriptions).toHaveLength(1);
      expect(db.pushSubscriptions?.[0].endpoint).toBe('https://push.example.com/sub/2');
    });

    it('rejects missing endpoint with 400 validation error', async () => {
      const { services } = setupTest();

      const err = await services.push
        .deletePushSubscription({ endpoint: '' })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });
  });
});
