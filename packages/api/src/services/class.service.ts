import type { ClassSession } from '@cute-teachy/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../config/endpoints';
import type { DateRange } from './service.types';

export const createClassService = (http: AxiosInstance) => ({
  list: (range: DateRange) =>
    http.get<ClassSession[]>(ENDPOINTS.classes.root, { params: range }).then((res) => res.data),
});

export type ClassService = ReturnType<typeof createClassService>;
