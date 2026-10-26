import type { CreateTaskInput, ID, SyncEnvelope, Task, UpdateTaskInput } from '@/types';
import type { AxiosInstance } from 'axios';
import { withClientId } from '@/lib/sync';
import { ENDPOINTS } from '../endpoints';
import type { DateRange } from './service.types';

export interface ListTasksParams extends Partial<DateRange> {
  readonly updatedSince?: string;
}

export const createTaskService = (http: AxiosInstance) => ({
  list: (params?: ListTasksParams) =>
    http.get<SyncEnvelope<Task>>(ENDPOINTS.tasks.root, { params }).then((res) => res.data),
  create: (input: CreateTaskInput) => {
    const payload = withClientId(input);
    return http.post<Task>(ENDPOINTS.tasks.root, payload).then((res) => res.data);
  },
  update: (id: ID, input: UpdateTaskInput) =>
    http.patch<Task>(ENDPOINTS.tasks.byId(id), input).then((res) => res.data),
  remove: (id: ID) => http.delete<void>(ENDPOINTS.tasks.byId(id)).then(() => undefined),
});

export type TaskService = ReturnType<typeof createTaskService>;
