import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { createMockAdapter } from '../mock-adapter';
import { createMockDb } from '../mock-db';

const setupTest = (options: { token?: string | null; onboarded?: boolean } = {}) => {
  const db = createMockDb();
  if (options.onboarded === false) {
    db.user = { ...db.user, onboardingCompletedAt: null };
  }
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

describe('Settings Mock Handler (SPEC-003 & S3-FE-05)', () => {
  describe('GET /me/settings', () => {
    it('returns default settings when not modified', async () => {
      const { services } = setupTest();
      const settings = await services.settings.get();

      expect(settings).toEqual({
        locale: 'vi',
        timeZone: 'Asia/Ho_Chi_Minh',
        pushEnabled: true,
        reminderLeadMinutes: 15,
      });
    });

    it('requires authentication (401 when no token)', async () => {
      const { services, setToken } = setupTest();
      setToken(null);

      await expect(services.settings.get()).rejects.toThrow(ApiError);
    });

    it('allows access even if onboarding is not completed', async () => {
      const { services } = setupTest({ onboarded: false });
      const settings = await services.settings.get();

      expect(settings).toBeDefined();
      expect(settings.locale).toBe('vi');
    });
  });

  describe('PATCH /me/settings', () => {
    it('updates locale successfully', async () => {
      const { services } = setupTest();
      const updated = await services.settings.update({ locale: 'en' });

      expect(updated.locale).toBe('en');
      expect(updated.timeZone).toBe('Asia/Ho_Chi_Minh');

      const refetched = await services.settings.get();
      expect(refetched.locale).toBe('en');
    });

    it('rejects invalid locale with 400 validation error', async () => {
      const { services } = setupTest();
      const err = await services.settings.update({ locale: 'fr' as never }).catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('updates timeZone with valid IANA timezone', async () => {
      const { services } = setupTest();
      const updated = await services.settings.update({ timeZone: 'America/New_York' });

      expect(updated.timeZone).toBe('America/New_York');

      const refetched = await services.settings.get();
      expect(refetched.timeZone).toBe('America/New_York');
    });

    it('rejects invalid IANA timeZone with 400 validation error', async () => {
      const { services } = setupTest();
      const err = await services.settings.update({ timeZone: 'Invalid/Zone_Name_123' }).catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).code).toBe('validation');
    });

    it('updates pushEnabled to false', async () => {
      const { services } = setupTest();
      const updated = await services.settings.update({ pushEnabled: false });

      expect(updated.pushEnabled).toBe(false);

      const refetched = await services.settings.get();
      expect(refetched.pushEnabled).toBe(false);
    });

    it('rejects non-boolean pushEnabled with 400 validation error', async () => {
      const { services } = setupTest();
      const err = await services.settings.update({ pushEnabled: 'yes' as never }).catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
    });

    it('updates reminderLeadMinutes to 5, 10, 30, 60', async () => {
      const { services } = setupTest();
      for (const minutes of [5, 10, 30, 60] as const) {
        const updated = await services.settings.update({ reminderLeadMinutes: minutes });
        expect(updated.reminderLeadMinutes).toBe(minutes);
      }
    });

    it('rejects invalid reminderLeadMinutes with 400 validation error', async () => {
      const { services } = setupTest();
      const err = await services.settings.update({ reminderLeadMinutes: 25 as never }).catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
    });

    it('allows partial update during onboarding', async () => {
      const { services } = setupTest({ onboarded: false });
      const updated = await services.settings.update({ timeZone: 'Asia/Tokyo' });

      expect(updated.timeZone).toBe('Asia/Tokyo');
    });
  });
});
