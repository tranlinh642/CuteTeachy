import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { Services } from '@/lib/api';
import type { InAppNotification, InAppNotificationListResponse } from '@/types';
import { AppShell } from '@/components/layout';
import {
  NotificationBell,
  activateNotificationItem,
} from './NotificationBell';

const routerPushSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
  usePathname: () => '/',
}));

const mockPushNotification = {
  isSupported: true,
  isIos: false,
  isStandalone: true,
  permission: 'default' as NotificationPermission,
  decision: 'can_prompt' as string,
  isSubscribed: false,
  isSubscribing: false,
  isDialogOpen: false,
  dialogStep: 'explanation' as const,
  error: null,
  pushEnabled: true,
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  confirmPermission: vi.fn().mockResolvedValue(true),
  unsubscribeDevice: vi.fn(),
  sendTestNotification: vi.fn(),
};

vi.mock('@/features/push', async () => {
  const actual = await vi.importActual('@/features/push');
  return {
    ...actual,
    usePushNotification: () => mockPushNotification,
  };
});

describe('NotificationBell Component (SPEC-006 S6-FE-02)', () => {
  let queryClient: QueryClient;
  let mockServices: Services;

  const sampleNotifications: InAppNotification[] = [
    {
      id: 'notif-unread-1',
      accountId: 'u-1',
      type: 'class_session',
      targetId: 'cs-1',
      title: 'Tiết dạy: Toán 5A',
      body: 'Bắt đầu lúc 08:00 tại Phòng 201',
      url: '/timetable?date=2026-10-29',
      data: { type: 'class_session', id: 'cs-1' },
      readAt: null,
      createdAt: '2026-10-29T00:45:00.000Z',
    },
    {
      id: 'notif-read-2',
      accountId: 'u-1',
      type: 'note',
      targetId: 'note-1',
      title: 'Nhắc nhở ghi chú: Họp tổ chuyên môn',
      body: '14:00',
      url: '/notes?noteId=note-1',
      data: { type: 'note', id: 'note-1' },
      readAt: '2026-10-29T00:50:00.000Z',
      createdAt: '2026-10-29T00:30:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPushNotification.decision = 'can_prompt';
    mockPushNotification.isIos = false;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockServices = {
      notifications: {
        list: vi.fn().mockResolvedValue({
          items: sampleNotifications,
          unreadCount: 1,
        }),
        markRead: vi.fn().mockResolvedValue({
          ...sampleNotifications[0],
          readAt: '2026-10-29T01:00:00.000Z',
        }),
        markAllRead: vi.fn().mockResolvedValue({ updatedCount: 1 }),
      },
    } as unknown as Services;
  });

  const renderBell = (
    props: React.ComponentProps<typeof NotificationBell> = {},
    data: InAppNotificationListResponse = { items: sampleNotifications, unreadCount: 1 },
  ) => {
    queryClient.setQueryData(queryKeys.notifications.list({ limit: 30 }), data);
    queryClient.setQueryData(queryKeys.notifications.list(), data);

    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider defaultLocale="vi">
            <NotificationBell {...props} />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
  };

  it('renders bell icon with unreadCount badge when unreadCount > 0', () => {
    const html = renderBell({}, { items: sampleNotifications, unreadCount: 3 });
    expect(html).toContain('data-testid="notification-bell-button"');
    expect(html).toContain('data-testid="notification-unread-badge"');
    expect(html).toContain('>3<');
  });

  it('hides unreadCount badge when unreadCount is 0', () => {
    const html = renderBell({}, { items: [], unreadCount: 0 });
    expect(html).toContain('data-testid="notification-bell-button"');
    expect(html).not.toContain('data-testid="notification-unread-badge"');
  });

  it('renders notification list, unread indicator, and "Đánh dấu tất cả đã đọc" button when opened', () => {
    const html = renderBell({ defaultOpen: true });
    expect(html).toContain('data-testid="notification-popover"');
    expect(html).toContain('Tiết dạy: Toán 5A');
    expect(html).toContain('Bắt đầu lúc 08:00 tại Phòng 201');
    expect(html).toContain('Nhắc nhở ghi chú: Họp tổ chuyên môn');
    expect(html).toContain('Đánh dấu tất cả đã đọc');
    expect(html).toContain('data-testid="unread-dot-notif-unread-1"');
    expect(html).not.toContain('data-testid="unread-dot-notif-read-2"');
  });

  it('renders quick push enable prompt inside bell popover when device has not enabled Web Push', () => {
    mockPushNotification.decision = 'can_prompt';
    const html = renderBell({ defaultOpen: true });
    expect(html).toContain('data-testid="bell-push-prompt"');
    expect(html).toContain('Bật thông báo');
  });

  it('hides quick push enable prompt inside bell popover when Web Push is already granted', () => {
    mockPushNotification.decision = 'already_granted';
    const html = renderBell({ defaultOpen: true });
    expect(html).not.toContain('data-testid="bell-push-prompt"');
  });

  it('marks notification as read and navigates to notification.url when activated', async () => {
    const markReadSpy = vi.fn().mockResolvedValue(undefined);
    const closeSpy = vi.fn();

    await activateNotificationItem(sampleNotifications[0], {
      markRead: markReadSpy,
      navigate: routerPushSpy,
      close: closeSpy,
    });

    expect(markReadSpy).toHaveBeenCalledWith('notif-unread-1');
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(routerPushSpy).toHaveBeenCalledWith('/timetable?date=2026-10-29');
  });

  it('renders NotificationBell inside AppShell Topbar', () => {
    const data: InAppNotificationListResponse = {
      items: sampleNotifications,
      unreadCount: 2,
    };
    queryClient.setQueryData(queryKeys.notifications.list({ limit: 30 }), data);

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider defaultLocale="vi">
            <AppShell topbarTitle={<span>Xin chào</span>}>
              <div>Nội dung</div>
            </AppShell>
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );

    expect(html).toContain('data-testid="notification-bell-button"');
    expect(html).toContain('data-testid="notification-unread-badge"');
    expect(html).toContain('>2<');
  });
});
