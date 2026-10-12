import type { CreateTagInput, ID, Tag } from '@/types';
import type { AxiosInstance } from 'axios';
import { ENDPOINTS } from '../endpoints';

export const createTagService = (http: AxiosInstance) => ({
  list: () => http.get<Tag[]>(ENDPOINTS.tags.root).then((res) => res.data),
  create: (input: CreateTagInput) => http.post<Tag>(ENDPOINTS.tags.root, input).then((res) => res.data),
  remove: (id: ID) => http.delete<void>(ENDPOINTS.tags.byId(id)).then(() => undefined),
});

export type TagService = ReturnType<typeof createTagService>;
