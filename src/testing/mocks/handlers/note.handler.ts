import { noteSchema } from '@/utils';
import type { Note, UpdateNoteInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { badRequest, created, noContent, notFound, ok, route } from '../mock-router';
import { nextId, nowISO } from './handler.utils';

const NOTE_BY_ID = ENDPOINTS.notes.byId(':id');

export const noteRoutes = [
  route('GET', ENDPOINTS.notes.root, (_request, db) =>
    ok([...db.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
  ),

  route('POST', ENDPOINTS.notes.root, (request, db) => {
    const parsed = noteSchema.safeParse(request.body);
    if (!parsed.success) return badRequest();
    const timestamp = nowISO();
    const note: Note = { ...parsed.data, id: nextId('note'), completed: false, createdAt: timestamp, updatedAt: timestamp };
    db.notes.unshift(note);
    return created(note);
  }),

  route('PATCH', NOTE_BY_ID, (request, db) => {
    const index = db.notes.findIndex((note) => note.id === request.params.id);
    const current = db.notes[index];
    if (!current) return notFound();
    const updated: Note = { ...current, ...(request.body as UpdateNoteInput), updatedAt: nowISO() };
    db.notes[index] = updated;
    return ok(updated);
  }),

  route('DELETE', NOTE_BY_ID, (request, db) => {
    const before = db.notes.length;
    db.notes = db.notes.filter((note) => note.id !== request.params.id);
    return db.notes.length === before ? notFound() : noContent();
  }),
];
