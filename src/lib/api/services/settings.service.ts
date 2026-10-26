import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';
import type { Settings, UpdateSettingsInput } from '@/types';

export const createSettingsService = (http: AxiosInstance) => ({
  get: async (): Promise<Settings> => {
    const res = await http.get<Settings>(ENDPOINTS.settings.me);
    return res.data;
  },
  update: async (input: UpdateSettingsInput): Promise<Settings> => {
    const res = await http.patch<Settings>(ENDPOINTS.settings.me, input);
    return res.data;
  },
});

export type SettingsService = ReturnType<typeof createSettingsService>;
