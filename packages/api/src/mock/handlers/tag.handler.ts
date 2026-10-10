import { tagSchema } from '@cute-teachy/core';
import type { Tag } from '@cute-teachy/types';
import { ENDPOINTS } from '../../config/endpoints';
import { badRequest, created, noContent, notFound, ok, route } from '../mock-router';
import { nextId } from './handler.utils';

export const tagRoutes = [
  route('GET', ENDPOINTS.tags.root, (_request, db) => ok(db.tags)),

  route('POST', ENDPOINTS.tags.root, (request, db) => {
    const parsed = tagSchema.safeParse(request.body);
    if (!parsed.success) return badRequest();
    const tag: Tag = { ...parsed.data, id: nextId('tag') };
    db.tags.push(tag);
    return created(tag);
  }),

  route('DELETE', ENDPOINTS.tags.byId(':id'), (request, db) => {
    const before = db.tags.length;
    db.tags = db.tags.filter((tag) => tag.id !== request.params.id);
    return db.tags.length === before ? notFound() : noContent();
  }),
];
