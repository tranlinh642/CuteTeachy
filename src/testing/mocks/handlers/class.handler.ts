import { ENDPOINTS } from '@/lib/api/endpoints';
import { generateClassSessions } from '@/utils';
import { ok, route } from '../mock-router';

export const classRoutes = [
  route('GET', ENDPOINTS.classes.root, (request, db) => {
    const { from, to } = request.query;
    if (from && to) {
      return ok(generateClassSessions(db.timetableSlots, db.sessionOverrides, db.adhocSessions, from, to));
    }
    return ok(db.classes);
  }),
];
