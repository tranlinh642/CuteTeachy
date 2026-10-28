import type {
  CreateTimetableSlotInput,
  ID,
  PatchTimetableSlotResult,
  SyncEnvelope,
  TimetableSlot,
  UpdateTimetableSlotInput,
} from '@/types';
import type { AxiosInstance } from 'axios';
import { withClientId } from '@/lib/sync';
import { ENDPOINTS } from '../endpoints';

export interface ListTimetableSlotsParams {
  readonly updatedSince?: string;
}

export const createTimetableSlotService = (http: AxiosInstance) => ({
  list: (params?: ListTimetableSlotsParams) =>
    http
      .get<SyncEnvelope<TimetableSlot>>(ENDPOINTS.timetableSlots.root, { params })
      .then((res) => res.data),

  create: (input: CreateTimetableSlotInput) => {
    const payload = withClientId(input);
    return http
      .post<TimetableSlot>(ENDPOINTS.timetableSlots.root, payload)
      .then((res) => res.data);
  },

  update: (id: ID, input: UpdateTimetableSlotInput) =>
    http
      .patch<PatchTimetableSlotResult>(ENDPOINTS.timetableSlots.byId(id), input)
      .then((res) => res.data),

  remove: (id: ID) =>
    http.delete<void>(ENDPOINTS.timetableSlots.byId(id)).then(() => undefined),
});

export type TimetableSlotService = ReturnType<typeof createTimetableSlotService>;
