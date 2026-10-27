import { APP_VERSION } from '@/config';
import { handleNotificationClickEvent, handlePushEvent } from '@/lib/push';
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_SHELL_ROUTES: (PrecacheEntry | string)[] = [
  { url: '/', revision: APP_VERSION },
  { url: '/login', revision: APP_VERSION },
  { url: '/calendar', revision: APP_VERSION },
  { url: '/notes', revision: APP_VERSION },
  { url: '/profile', revision: APP_VERSION },
];

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), ...APP_SHELL_ROUTES],
  precacheOptions: {
    navigateFallback: '/',
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Background Sync: thông báo client tiếp tục gửi các tác vụ ngoại tuyến khi có kết nối
self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as Event & { tag?: string; waitUntil?: (p: Promise<unknown>) => void };
  if (syncEvent.tag === 'sync-offline-mutations' && syncEvent.waitUntil) {
    syncEvent.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_OFFLINE_MUTATIONS' });
        });
      }),
    );
  }
});

// Push Notification: nhận và hiển thị thông báo Reminder
self.addEventListener('push', (event: PushEvent) => {
  handlePushEvent(event, self.registration);
});

// Notification Click: đóng thông báo, focus hoặc điều hướng tab app đúng ngày
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  handleNotificationClickEvent(event, self.clients, self.location.origin);
});
