import type { Inspiration } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';

export const createInspirationService = (http: AxiosInstance) => ({
  today: () => http.get<Inspiration>(ENDPOINTS.inspirations.today).then((res) => res.data),
});

export type InspirationService = ReturnType<typeof createInspirationService>;
