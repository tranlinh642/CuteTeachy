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

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? [])],
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Cho phép client kích hoạt bản Service Worker mới ngay khi người dùng bấm "Cập nhật ngay"
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const payload = event.data as { type?: string } | null | undefined;
  if (payload?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

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
