import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from '@/stores';
import { unsubscribeDevice } from '@/features/push';

describe('useLogout push unsubscription integration (SPEC-005 & S5-FE-01)', () => {
  beforeEach(() => {
    useSessionStore.getState().setSession({
      user: {
        id: 'u1',
        email: 'teacher@test.vn',
        emailVerified: true,
        loginProviders: ['password'],
        fullName: 'Nguyen Van A',
        displayName: 'A',
        gender: 'other',
        onboardingCompletedAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'access-123',
      expiresAt: '2026-12-31T00:00:00Z',
      refreshToken: 'refresh-456',
      refreshExpiresAt: '2027-01-31T00:00:00Z',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls push.deletePushSubscription with endpoint before auth.logout', async () => {
    const mockEndpoint = 'https://push.example.com/device/sub-xyz';
    const calls: string[] = [];

    const mockPush = {
      deletePushSubscription: vi.fn().mockImplementation(async (payload) => {
        calls.push(`push.delete:${payload.endpoint}`);
      }),
    };

    const mockAuth = {
      logout: vi.fn().mockImplementation(async () => {
        calls.push('auth.logout');
      }),
    };

    const mockSubscription = {
      endpoint: mockEndpoint,
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
    };

    const mockRegistration = {
      pushManager: mockPushManager,
    };

    // Setup browser globals
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration),
      },
    });
    vi.stubGlobal('PushManager', class {});

    const success = await unsubscribeDevice({
      deletePushSubscription: mockPush.deletePushSubscription,
    });
    await mockAuth.logout('refresh-456');

    expect(success).toBe(true);
    expect(calls).toEqual([`push.delete:${mockEndpoint}`, 'auth.logout']);
    expect(mockPush.deletePushSubscription).toHaveBeenCalledWith({ endpoint: mockEndpoint });
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalledWith('refresh-456');
  });

  it('gracefully catches network error on deletePushSubscription without blocking logout', async () => {
    const mockEndpoint = 'https://push.example.com/device/sub-xyz';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mockPush = {
      deletePushSubscription: vi.fn().mockRejectedValue(new Error('Network error (offline)')),
    };

    const mockAuth = {
      logout: vi.fn().mockResolvedValue(undefined),
    };

    const mockSubscription = {
      endpoint: mockEndpoint,
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
    };

    const mockRegistration = {
      pushManager: mockPushManager,
    };

    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration),
      },
    });
    vi.stubGlobal('PushManager', class {});

    const success = await unsubscribeDevice({
      deletePushSubscription: mockPush.deletePushSubscription,
    });
    await mockAuth.logout('refresh-456');

    expect(success).toBe(true);
    expect(mockPush.deletePushSubscription).toHaveBeenCalledWith({ endpoint: mockEndpoint });
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(mockAuth.logout).toHaveBeenCalledWith('refresh-456');
    expect(warnSpy).toHaveBeenCalled();
  });
});
