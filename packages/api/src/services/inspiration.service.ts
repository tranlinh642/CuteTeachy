import type { Inspiration } from '@cute-teachy/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../config/endpoints';

export const createInspirationService = (http: AxiosInstance) => ({
  today: () => http.get<Inspiration>(ENDPOINTS.inspirations.today).then((res) => res.data),
});

export type InspirationService = ReturnType<typeof createInspirationService>;
