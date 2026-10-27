/**
 * @file sw-handlers.ts
 * Event handler logic for Service Worker push and notificationclick events.
 *
 * SPEC-005 (Push & Reminder):
 * - `push`: parses payload and calls `self.registration.showNotification`.
 * - `notificationclick`: closes notification, resolves target URL, searches open client
 *   tabs for same origin, focusing and navigating if present or opening a new window.
 */

import { formatPushNotification } from './format-notification';

/**
 * Handles Web Push event in Service Worker.
 */
export function handlePushEvent(
  event: PushEvent,
  registration: ServiceWorkerRegistration,
): void {
  let rawPayload: unknown = null;

  if (event.data) {
    try {
      rawPayload = event.data.json();
    } catch {
      try {
        rawPayload = event.data.text();
      } catch {
        rawPayload = null;
      }
    }
  }

  const notification = formatPushNotification(rawPayload);

  event.waitUntil(
    registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      tag: notification.tag,
      data: notification.data,
    }),
  );
}

/**
 * Finds an open client window with the same origin to focus & navigate,
 * or opens a new window if none exists.
 */
export async function focusOrOpenClient(
  url: string,
  clients: Clients,
  origin: string,
): Promise<void> {
  let targetUrl: string;
  try {
    targetUrl = new URL(url, origin).href;
  } catch {
    targetUrl = new URL('/', origin).href;
  }

  const windowClients = (await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })) as readonly WindowClient[];

  // 1. Nếu có client đang mở đúng targetUrl -> focus ngay vào tab đó
  const exactMatch = windowClients.find((client) => client.url === targetUrl);
  if (exactMatch) {
    await exactMatch.focus();
    return;
  }

  // 2. Nếu có client cùng origin -> navigate tới targetUrl và focus
  const sameOriginClient = windowClients.find((client) => {
    try {
      return new URL(client.url, origin).origin === new URL(origin).origin;
    } catch {
      return false;
    }
  });

  if (sameOriginClient) {
    if (typeof sameOriginClient.navigate === 'function') {
      try {
        await sameOriginClient.navigate(targetUrl);
      } catch {
        // Fallback: nếu navigate thất bại, vẫn focus tab
      }
    }
    await sameOriginClient.focus();
    return;
  }

  // 3. Nếu chưa có client nào -> mở window mới
  if (typeof clients.openWindow === 'function') {
    await clients.openWindow(targetUrl);
  }
}

/**
 * Handles notificationclick event in Service Worker.
 */
export function handleNotificationClickEvent(
  event: NotificationEvent,
  clients: Clients,
  origin: string,
): void {
  event.notification.close();
  const rawUrl = (event.notification.data?.url as string | undefined) || '/';
  event.waitUntil(focusOrOpenClient(rawUrl, clients, origin));
}
