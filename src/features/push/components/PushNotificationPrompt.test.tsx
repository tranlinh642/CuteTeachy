import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServicesContext } from '@/lib/api/services-context';
import type { Services } from '@/lib/api';
import { useSessionStore } from '@/stores';
import { PushNotificationPrompt } from './PushNotificationPrompt';

const mockPushNotification = {
  isSupported: true,
  isIos: false,
  isStandalone: true,
  permission: 'default' as NotificationPermission,
  decision: 'can_prompt',
  isSubscribed: false,
  isSubscribing: false,
  isDialogOpen: false,
  dialogStep: 'explanation' as const,
  error: null,
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  confirmPermission: vi.fn(),
  unsubscribeDevice: vi.fn(),
};

vi.mock('../hooks/use-push-notification', () => ({
  usePushNotification: () => mockPushNotification,
}));

vi.mock('./PushPermissionDialog', () => ({
  PushPermissionDialog: ({ open, title }: { open: boolean; title?: string }) =>
    open ? <div data-testid="push-dialog">{title}</div> : null,
}));

describe('PushNotificationPrompt Component (SPEC-005 US 1, 2)', () => {
  let queryClient: QueryClient;
  let mockServices: Services;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useSessionStore.setState({
      session: {
        user: {
          id: 'u1',
          email: 'teacher@test.vn',
          emailVerified: true,
          loginProviders: ['password'],
          fullName: 'Cô Lan',
          displayName: 'Lan',
          gender: 'female',
          onboardingCompletedAt: '2026-01-01T00:00:00Z',
        },
        accessToken: 'token-123',
        expiresAt: '2026-12-31T00:00:00Z',
        refreshToken: 'refresh-456',
        refreshExpiresAt: '2027-01-31T00:00:00Z',
      },
      remember: true,
      hydrated: true,
    });
  });

  const renderPrompt = (hasItems = false) => {
    mockServices = {
      tasks: {
        list: vi.fn().mockResolvedValue({ items: hasItems ? [{ id: 'task-1' }] : [] }),
      },
      timetableSlots: {
        list: vi.fn().mockResolvedValue({ items: [] }),
      },
      push: {
        getVapidPublicKey: vi.fn(),
        createPushSubscription: vi.fn(),
        deletePushSubscription: vi.fn(),
      },
    } as unknown as Services;

    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider defaultLocale="vi">
            <PushNotificationPrompt
              hasCreatedItemOverride={hasItems}
              isAuthenticatedOverride={true}
            />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
  };

  it('renders nothing when user has no created tasks or timetable slots', () => {
    const html = renderPrompt(false);
    expect(html).toBe('');
  });

  it('renders prompt banner when user has created at least one task or slot', () => {
    const html = renderPrompt(true);
    expect(html).toContain('Đừng bỏ lỡ tiết dạy &amp; công việc');
    expect(html).toContain('Bật thông báo');
  });

  it('does not render banner if permission is already granted', () => {
    mockPushNotification.decision = 'already_granted';
    const html = renderPrompt(true);
    expect(html).toBe('');
    mockPushNotification.decision = 'can_prompt';
  });
});
