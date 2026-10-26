import type { CreateNoteInput, ID, Note, SyncEnvelope, UpdateNoteInput } from '@/types';
import type { AxiosInstance } from 'axios';
import { generateClientUuid, withClientId } from '@/lib/sync';
import { ENDPOINTS } from '../endpoints';

export interface ListNotesParams {
  readonly limit?: number;
  readonly cursor?: string;
  readonly q?: string;
  readonly tagId?: string;
  readonly updatedSince?: string;
}

export const createNoteService = (http: AxiosInstance) => ({
  list: (params?: ListNotesParams) =>
    http.get<SyncEnvelope<Note>>(ENDPOINTS.notes.root, { params }).then((res) => res.data),
  create: (input: CreateNoteInput) => {
    const payload = withClientId(input);
    const checklist = payload.checklist?.map((item) => ({
      ...item,
      id: item.id && item.id.trim() ? item.id : generateClientUuid(),
    }));
    return http
      .post<Note>(ENDPOINTS.notes.root, {
        ...payload,
        ...(checklist !== undefined ? { checklist } : {}),
      })
      .then((res) => res.data);
  },
  update: (id: ID, input: UpdateNoteInput) =>
    http.patch<Note>(ENDPOINTS.notes.byId(id), input).then((res) => res.data),
  remove: (id: ID) => http.delete<void>(ENDPOINTS.notes.byId(id)).then(() => undefined),
});

export type NoteService = ReturnType<typeof createNoteService>;
