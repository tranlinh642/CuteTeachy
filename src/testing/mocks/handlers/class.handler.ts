import { ENDPOINTS } from '@/lib/api/endpoints';
import { ok, route } from '../mock-router';
import { inDateRange } from './handler.utils';

export const classRoutes = [
  route('GET', ENDPOINTS.classes.root, (request, db) => ok(inDateRange(db.classes, request.query))),
];
