import { describe, expect, it } from 'vitest';
import { createServices } from '@/lib/api/services';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createMockAdapter } from '@/testing/mocks/mock-adapter';
import { createMockDb } from '@/testing/mocks/mock-db';
import { getDeviceTimeZone } from './utils/timezone';

describe('Onboarding TimeZone Integration (SPEC-003 & S3-FE-05)', () => {
  it('sends device timeZone alongside profile completion to updateSettings', async () => {
    const db = createMockDb();
    db.user = {
      ...db.user,
      onboardingCompletedAt: null,
      gender: null,
      fullName: '',
    };
    db.settings = {
      locale: 'vi',
      timeZone: 'Asia/Ho_Chi_Minh',
      pushEnabled: true,
      reminderLeadMinutes: 15,
    };

    const httpClient = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => 'mock-token',
    });
    httpClient.defaults.adapter = createMockAdapter({ latencyMs: 0, db });
    const services = createServices(httpClient);

    const deviceTz = getDeviceTimeZone();

    // Completing onboarding: updates profile and settings with timeZone concurrently
    const [updatedUser, updatedSettings] = await Promise.all([
      services.auth.updateProfile({
        fullName: 'Cô Mai Linh',
        displayName: 'Linh',
        title: 'Giáo viên Tiếng Anh',
        gender: 'female',
      }),
      services.settings.update({ timeZone: deviceTz }),
    ]);

    expect(updatedUser.fullName).toBe('Cô Mai Linh');
    expect(updatedUser.onboardingCompletedAt).not.toBeNull();
    expect(updatedSettings.timeZone).toBe(deviceTz);

    // Verify persistence in DB
    const finalSettings = await services.settings.get();
    expect(finalSettings.timeZone).toBe(deviceTz);
  });
});
