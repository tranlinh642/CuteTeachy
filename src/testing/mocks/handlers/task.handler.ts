import { taskSchema } from '@/utils';
import type { Task, UpdateTaskInput } from '@/types';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { badRequest, created, noContent, notFound, ok, route } from '../mock-router';
import { inDateRange, nextId, nowISO } from './handler.utils';

const TASK_BY_ID = ENDPOINTS.tasks.byId(':id');

export const taskRoutes = [
  route('GET', ENDPOINTS.tasks.root, (request, db) => ok(inDateRange(db.tasks, request.query))),

  route('POST', ENDPOINTS.tasks.root, (request, db) => {
    const parsed = taskSchema.safeParse(request.body);
    if (!parsed.success) return badRequest();
    const timestamp = nowISO();
    const task: Task = { ...parsed.data, id: nextId('task'), completed: false, createdAt: timestamp, updatedAt: timestamp };
    db.tasks.push(task);
    return created(task);
  }),

  route('PATCH', TASK_BY_ID, (request, db) => {
    const index = db.tasks.findIndex((task) => task.id === request.params.id);
    const current = db.tasks[index];
    if (!current) return notFound();
    const updated: Task = { ...current, ...(request.body as UpdateTaskInput), updatedAt: nowISO() };
    db.tasks[index] = updated;
    return ok(updated);
  }),

  route('DELETE', TASK_BY_ID, (request, db) => {
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((task) => task.id !== request.params.id);
    return db.tasks.length === before ? notFound() : noContent();
  }),
];
