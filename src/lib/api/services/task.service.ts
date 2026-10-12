import type { CreateTaskInput, ID, Task, UpdateTaskInput } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';
import type { DateRange } from './service.types';

export const createTaskService = (http: AxiosInstance) => ({
  list: (range?: DateRange) =>
    http.get<Task[]>(ENDPOINTS.tasks.root, { params: range }).then((res) => res.data),
  create: (input: CreateTaskInput) => http.post<Task>(ENDPOINTS.tasks.root, input).then((res) => res.data),
  update: (id: ID, input: UpdateTaskInput) =>
    http.patch<Task>(ENDPOINTS.tasks.byId(id), input).then((res) => res.data),
  remove: (id: ID) => http.delete<void>(ENDPOINTS.tasks.byId(id)).then(() => undefined),
});

export type TaskService = ReturnType<typeof createTaskService>;
