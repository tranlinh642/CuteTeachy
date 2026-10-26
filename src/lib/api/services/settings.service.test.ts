import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import type { Settings } from '@/types';
import { createSettingsService } from './settings.service';

describe('settingsService', () => {
  const createMockHttp = () => {
    return {
      get: vi.fn(),
      patch: vi.fn(),
    } as unknown as AxiosInstance;
  };

  const mockSettings: Settings = {
    locale: 'vi',
    timeZone: 'Asia/Ho_Chi_Minh',
    pushEnabled: true,
    reminderLeadMinutes: 15,
  };

  describe('get', () => {
    it('requests /me/settings and returns the Settings object', async () => {
      const http = createMockHttp();
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockSettings });

      const service = createSettingsService(http);
      const result = await service.get();

      expect(http.get).toHaveBeenCalledWith('/me/settings');
      expect(result).toEqual(mockSettings);
    });
  });

  describe('update', () => {
    it('sends PATCH /me/settings with partial input and returns updated Settings', async () => {
      const http = createMockHttp();
      const updated: Settings = { ...mockSettings, locale: 'en', reminderLeadMinutes: 30 };
      vi.mocked(http.patch).mockResolvedValueOnce({ data: updated });

      const service = createSettingsService(http);
      const result = await service.update({ locale: 'en', reminderLeadMinutes: 30 });

      expect(http.patch).toHaveBeenCalledWith('/me/settings', {
        locale: 'en',
        reminderLeadMinutes: 30,
      });
      expect(result).toEqual(updated);
    });
  });
});
