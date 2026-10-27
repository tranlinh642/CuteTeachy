import { describe, expect, it, vi } from 'vitest';
import {
  focusOrOpenClient,
  handleNotificationClickEvent,
  handlePushEvent,
} from './sw-handlers';

describe('sw-handlers (S5-FE-02)', () => {
  describe('handlePushEvent', () => {
    it('receives push event with json payload, formats and calls showNotification', async () => {
      const payload = {
        type: 'task',
        id: 't-123',
        title: 'Họp hội đồng sư phạm',
        body: '14:00 tại Hội trường',
        targetDate: '2026-10-27',
      };

      const waitUntilPromises: Promise<unknown>[] = [];
      const fakePushEvent = {
        data: {
          json: () => payload,
          text: () => JSON.stringify(payload),
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as PushEvent;

      const showNotificationMock = vi.fn().mockResolvedValue(undefined);
      const fakeRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration;

      handlePushEvent(fakePushEvent, fakeRegistration);

      expect(waitUntilPromises.length).toBe(1);
      await waitUntilPromises[0];

      expect(showNotificationMock).toHaveBeenCalledTimes(1);
      expect(showNotificationMock).toHaveBeenCalledWith('Họp hội đồng sư phạm', {
        body: '14:00 tại Hội trường',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'reminder-task-t-123',
        data: expect.objectContaining({
          type: 'task',
          id: 't-123',
          url: '/tasks?date=2026-10-27',
        }),
      });
    });

    it('handles push event when data is null, falling back safely', async () => {
      const waitUntilPromises: Promise<unknown>[] = [];
      const fakePushEvent = {
        data: null,
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as PushEvent;

      const showNotificationMock = vi.fn().mockResolvedValue(undefined);
      const fakeRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration;

      handlePushEvent(fakePushEvent, fakeRegistration);

      expect(waitUntilPromises.length).toBe(1);
      await waitUntilPromises[0];

      expect(showNotificationMock).toHaveBeenCalledTimes(1);
      expect(showNotificationMock).toHaveBeenCalledWith(
        'CuteTeachy',
        expect.objectContaining({
          body: 'Bạn có thông báo mới từ CuteTeachy.',
          tag: 'reminder-general',
        }),
      );
    });

    it('handles push event when data.json throws, falling back to data.text', async () => {
      const rawText = JSON.stringify({
        type: 'class_session',
        id: 'cs-88',
        title: 'Vật lý 12',
      });

      const waitUntilPromises: Promise<unknown>[] = [];
      const fakePushEvent = {
        data: {
          json: () => {
            throw new Error('Not valid json object directly');
          },
          text: () => rawText,
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as PushEvent;

      const showNotificationMock = vi.fn().mockResolvedValue(undefined);
      const fakeRegistration = {
        showNotification: showNotificationMock,
      } as unknown as ServiceWorkerRegistration;

      handlePushEvent(fakePushEvent, fakeRegistration);

      expect(waitUntilPromises.length).toBe(1);
      await waitUntilPromises[0];

      expect(showNotificationMock).toHaveBeenCalledWith(
        'Vật lý 12',
        expect.objectContaining({
          tag: 'reminder-class-session-cs-88',
        }),
      );
    });
  });

  describe('handleNotificationClickEvent & focusOrOpenClient', () => {
    const origin = 'https://app.cuteteachy.com';

    it('closes notification and focuses window when exact URL is already open', async () => {
      const closeMock = vi.fn();
      const waitUntilPromises: Promise<unknown>[] = [];

      const fakeNotificationEvent = {
        notification: {
          close: closeMock,
          data: {
            url: '/tasks?date=2026-10-27',
          },
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as NotificationEvent;

      const focusMock = vi.fn().mockResolvedValue(undefined);
      const navigateMock = vi.fn().mockResolvedValue(undefined);

      const fakeClient = {
        url: 'https://app.cuteteachy.com/tasks?date=2026-10-27',
        focus: focusMock,
        navigate: navigateMock,
      } as unknown as WindowClient;

      const fakeClients = {
        matchAll: vi.fn().mockResolvedValue([fakeClient]),
        openWindow: vi.fn(),
      } as unknown as Clients;

      handleNotificationClickEvent(fakeNotificationEvent, fakeClients, origin);

      expect(closeMock).toHaveBeenCalledTimes(1);
      expect(waitUntilPromises.length).toBe(1);
      await waitUntilPromises[0];

      expect(focusMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).not.toHaveBeenCalled();
      expect(fakeClients.openWindow).not.toHaveBeenCalled();
    });

    it('navigates and focuses open window when client is on same origin but different URL', async () => {
      const closeMock = vi.fn();
      const waitUntilPromises: Promise<unknown>[] = [];

      const fakeNotificationEvent = {
        notification: {
          close: closeMock,
          data: {
            url: '/timetable?date=2026-10-28',
          },
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as NotificationEvent;

      const focusMock = vi.fn().mockResolvedValue(undefined);
      const navigateMock = vi.fn().mockResolvedValue(undefined);

      const fakeClient = {
        url: 'https://app.cuteteachy.com/notes',
        focus: focusMock,
        navigate: navigateMock,
      } as unknown as WindowClient;

      const fakeClients = {
        matchAll: vi.fn().mockResolvedValue([fakeClient]),
        openWindow: vi.fn(),
      } as unknown as Clients;

      handleNotificationClickEvent(fakeNotificationEvent, fakeClients, origin);

      expect(closeMock).toHaveBeenCalledTimes(1);
      await waitUntilPromises[0];

      expect(navigateMock).toHaveBeenCalledWith('https://app.cuteteachy.com/timetable?date=2026-10-28');
      expect(focusMock).toHaveBeenCalledTimes(1);
      expect(fakeClients.openWindow).not.toHaveBeenCalled();
    });

    it('opens new window when no client tab is open', async () => {
      const closeMock = vi.fn();
      const waitUntilPromises: Promise<unknown>[] = [];

      const fakeNotificationEvent = {
        notification: {
          close: closeMock,
          data: {
            url: '/tasks?date=2026-10-27',
          },
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as NotificationEvent;

      const openWindowMock = vi.fn().mockResolvedValue(undefined);
      const fakeClients = {
        matchAll: vi.fn().mockResolvedValue([]),
        openWindow: openWindowMock,
      } as unknown as Clients;

      handleNotificationClickEvent(fakeNotificationEvent, fakeClients, origin);

      expect(closeMock).toHaveBeenCalledTimes(1);
      await waitUntilPromises[0];

      expect(openWindowMock).toHaveBeenCalledWith('https://app.cuteteachy.com/tasks?date=2026-10-27');
    });

    it('falls back to "/" when notification.data or url is missing', async () => {
      const closeMock = vi.fn();
      const waitUntilPromises: Promise<unknown>[] = [];

      const fakeNotificationEvent = {
        notification: {
          close: closeMock,
          data: undefined,
        },
        waitUntil: (p: Promise<unknown>) => {
          waitUntilPromises.push(p);
        },
      } as unknown as NotificationEvent;

      const openWindowMock = vi.fn().mockResolvedValue(undefined);
      const fakeClients = {
        matchAll: vi.fn().mockResolvedValue([]),
        openWindow: openWindowMock,
      } as unknown as Clients;

      handleNotificationClickEvent(fakeNotificationEvent, fakeClients, origin);

      await waitUntilPromises[0];
      expect(openWindowMock).toHaveBeenCalledWith('https://app.cuteteachy.com/');
    });

    it('still focuses tab even if navigate throws an error', async () => {
      const focusMock = vi.fn().mockResolvedValue(undefined);
      const navigateMock = vi.fn().mockRejectedValue(new Error('Navigation failed'));

      const fakeClient = {
        url: 'https://app.cuteteachy.com/profile',
        focus: focusMock,
        navigate: navigateMock,
      } as unknown as WindowClient;

      const fakeClients = {
        matchAll: vi.fn().mockResolvedValue([fakeClient]),
        openWindow: vi.fn(),
      } as unknown as Clients;

      await focusOrOpenClient('/tasks?date=2026-10-27', fakeClients, origin);

      expect(navigateMock).toHaveBeenCalledTimes(1);
      expect(focusMock).toHaveBeenCalledTimes(1);
    });
  });
});
