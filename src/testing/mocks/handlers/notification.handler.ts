import { ENDPOINTS } from '@/lib/api/endpoints';
import { notFound, ok, route, type MockRoute } from '../mock-router';
import { nowISO } from './handler.utils';

export const notificationRoutes: readonly MockRoute[] = [
  route('GET', ENDPOINTS.notifications.root, (request, db) => {
    const all = [...(db.notifications ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const unreadCount = all.filter((n) => n.readAt === null).length;

    const unreadOnly = request.query.unreadOnly === 'true';
    const rawLimit = request.query.limit ? Number(request.query.limit) : 30;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 30;

    const filtered = unreadOnly ? all.filter((n) => n.readAt === null) : all;
    const items = filtered.slice(0, limit);

    return ok({
      items,
      unreadCount,
    });
  }),

  route('PATCH', '/notifications/:id/read', (request, db) => {
    const id = request.params.id;
    db.notifications = db.notifications ?? [];
    const index = db.notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      return notFound('not_found', 'Notification not found');
    }

    const existing = db.notifications[index];
    const updated = {
      ...existing,
      readAt: existing.readAt ?? nowISO(),
    };
    db.notifications[index] = updated;

    return ok(updated);
  }),

  route('POST', ENDPOINTS.notifications.readAll, (_request, db) => {
    db.notifications = db.notifications ?? [];
    const now = nowISO();
    let updatedCount = 0;

    db.notifications = db.notifications.map((n) => {
      if (n.readAt === null) {
        updatedCount += 1;
        return { ...n, readAt: now };
      }
      return n;
    });

    return ok({ updatedCount });
  }),
];
