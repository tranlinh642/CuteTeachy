import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '@/lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServicesContext } from '@/lib/api/services-context';
import type { Services } from '@/lib/api';
import { useSessionStore } from '@/stores';
import { ProfileView } from './components/ProfileView';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock dialogs to render simple elements in static markup
vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) => (open ? <div data-testid="dialog" data-title={title}>{children}</div> : null),
}));

vi.mock('./components/EditProfileDialog', () => ({
  EditProfileDialog: () => null,
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));

// Mock hook to control push notification decisions during tests
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

vi.mock('@/features/push', async () => {
  const actual = await vi.importActual('@/features/push');
  return {
    ...actual,
    usePushNotification: () => mockPushNotification,
  };
});

describe('ProfileView Push Notifications Switch (SPEC-005 & S5-FE-01)', () => {
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

    mockServices = {
      settings: {
        get: vi.fn().mockResolvedValue({
          locale: 'vi',
          timeZone: 'Asia/Ho_Chi_Minh',
          pushEnabled: true,
          reminderLeadMinutes: 15,
        }),
        update: vi.fn().mockImplementation((input) => Promise.resolve(input)),
      },
      push: {
        getVapidPublicKey: vi.fn().mockResolvedValue({ publicKey: 'mock-key' }),
        createPushSubscription: vi.fn().mockResolvedValue({}),
        deletePushSubscription: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Services;

    useSessionStore.getState().setSession({
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
    });
  });

  const renderProfile = () => {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider defaultLocale="vi">
            <ProfileView />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
  };

  it('renders push notification switch in ProfileView', () => {
    const html = renderProfile();
    expect(html).toContain('Thông báo đẩy');
    expect(html).toContain('Nhắc trước giờ hẹn');
  });

  it('displays denied status badge when permission is blocked in browser', () => {
    mockPushNotification.decision = 'permission_denied';
    const html = renderProfile();
    expect(html).toContain('Đã bị chặn trong trình duyệt');
  });

  it('displays iOS Home Screen requirement badge when on iOS non-standalone', () => {
    mockPushNotification.decision = 'ios_needs_pwa';
    const html = renderProfile();
    expect(html).toContain('Cần thêm vào màn hình chính');
  });

  it('renders push permission dialog when isDialogOpen is true', () => {
    mockPushNotification.isDialogOpen = true;
    mockPushNotification.dialogStep = 'explanation';
    const html = renderProfile();
    expect(html).toContain('data-testid="dialog"');
    expect(html).toContain('data-title="Bật thông báo nhắc việc"');
  });
});
