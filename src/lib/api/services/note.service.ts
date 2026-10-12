import type { CreateNoteInput, ID, Note, UpdateNoteInput } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';

export const createNoteService = (http: AxiosInstance) => ({
  list: () => http.get<Note[]>(ENDPOINTS.notes.root).then((res) => res.data),
  create: (input: CreateNoteInput) => http.post<Note>(ENDPOINTS.notes.root, input).then((res) => res.data),
  update: (id: ID, input: UpdateNoteInput) =>
    http.patch<Note>(ENDPOINTS.notes.byId(id), input).then((res) => res.data),
  remove: (id: ID) => http.delete<void>(ENDPOINTS.notes.byId(id)).then(() => undefined),
});

export type NoteService = ReturnType<typeof createNoteService>;
