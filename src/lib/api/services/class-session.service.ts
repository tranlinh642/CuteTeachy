import type {
  ClassSession,
  CreateClassSessionInput,
  ID,
  SyncEnvelope,
  UpdateClassSessionInput,
} from '@/types';
import type { AxiosInstance } from 'axios';
import { withClientId } from '@/lib/sync';
import { ENDPOINTS } from '../endpoints';
import type { DateRange } from './service.types';

export interface ListClassSessionsParams extends DateRange {
  readonly updatedSince?: string;
}

export const createClassSessionService = (http: AxiosInstance) => ({
  list: (params: ListClassSessionsParams) =>
    http
      .get<SyncEnvelope<ClassSession>>(ENDPOINTS.classSessions.root, { params })
      .then((res) => res.data),

  create: (input: CreateClassSessionInput) => {
    const payload = withClientId(input);
    return http
      .post<ClassSession>(ENDPOINTS.classSessions.root, payload)
      .then((res) => res.data);
  },

  update: (id: ID, input: UpdateClassSessionInput) =>
    http
      .patch<ClassSession>(ENDPOINTS.classSessions.byId(id), input)
      .then((res) => res.data),

  remove: (id: ID) =>
    http.delete<void>(ENDPOINTS.classSessions.byId(id)).then(() => undefined),
});

export type ClassSessionService = ReturnType<typeof createClassSessionService>;
