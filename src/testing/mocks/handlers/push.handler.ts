import { ENDPOINTS } from '@/lib/api/endpoints';
import type { CreatePushSubscriptionInput, DeletePushSubscriptionInput } from '@/types';
import { badRequest, created, noContent, ok, route, type MockRoute } from '../mock-router';

export const pushRoutes: readonly MockRoute[] = [
  route(
    'GET',
    ENDPOINTS.push.vapidPublicKey,
    () => ok({ publicKey: 'mock-vapid-public-key' }),
    { isPublic: true },
  ),

  route('POST', ENDPOINTS.push.subscriptions, (request, db) => {
    const body = request.body as CreatePushSubscriptionInput | undefined;
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return badRequest('endpoint and keys (p256dh, auth) are required');
    }

    db.pushSubscriptions = db.pushSubscriptions ?? [];
    const existingIndex = db.pushSubscriptions.findIndex((sub) => sub.endpoint === body.endpoint);
    if (existingIndex >= 0) {
      db.pushSubscriptions[existingIndex] = body;
      return ok(body);
    }

    db.pushSubscriptions.push(body);
    return created(body);
  }),

  route('DELETE', ENDPOINTS.push.subscriptions, (request, db) => {
    const body = request.body as DeletePushSubscriptionInput | undefined;
    if (!body?.endpoint) {
      return badRequest('endpoint is required');
    }

    db.pushSubscriptions = db.pushSubscriptions ?? [];
    db.pushSubscriptions = db.pushSubscriptions.filter((sub) => sub.endpoint !== body.endpoint);
    return noContent();
  }),
];
