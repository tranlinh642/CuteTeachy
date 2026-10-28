import type { CreateTagInput, ID, SyncEnvelope, Tag, UpdateTagInput } from '@/types';
import type { AxiosInstance } from 'axios';
import { withClientId } from '@/lib/sync';
import { ENDPOINTS } from '../endpoints';

export const createTagService = (http: AxiosInstance) => ({
  list: (updatedSince?: string) =>
    http
      .get<SyncEnvelope<Tag>>(ENDPOINTS.tags.root, {
        params: updatedSince ? { updatedSince } : undefined,
      })
      .then((res) => res.data),

  create: (input: CreateTagInput) => {
    const payload = withClientId(input);
    return http.post<Tag>(ENDPOINTS.tags.root, payload).then((res) => res.data);
  },

  update: (id: ID, input: UpdateTagInput) =>
    http.patch<Tag>(ENDPOINTS.tags.byId(id), input).then((res) => res.data),

  remove: (id: ID) =>
    http.delete<void>(ENDPOINTS.tags.byId(id)).then(() => undefined),
});

export type TagService = ReturnType<typeof createTagService>;
