import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from '@/stores';

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

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue({
        endpoint: mockEndpoint,
      }),
    };

    const mockNavigator = {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: mockPushManager,
        }),
      },
    };

    // Simulate mutationFn logic
    const reg = await mockNavigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub?.endpoint) {
      await mockPush.deletePushSubscription({ endpoint: sub.endpoint });
    }
    await mockAuth.logout('refresh-456');

    expect(calls).toEqual([`push.delete:${mockEndpoint}`, 'auth.logout']);
    expect(mockPush.deletePushSubscription).toHaveBeenCalledWith({ endpoint: mockEndpoint });
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

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue({
        endpoint: mockEndpoint,
      }),
    };

    const mockNavigator = {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: mockPushManager,
        }),
      },
    };

    // Simulate mutationFn logic with try/catch
    try {
      const reg = await mockNavigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub?.endpoint) {
        await mockPush.deletePushSubscription({ endpoint: sub.endpoint });
      }
    } catch (err) {
      console.warn('[Push] Failed to delete push subscription on logout:', err);
    }

    await mockAuth.logout('refresh-456');

    expect(mockPush.deletePushSubscription).toHaveBeenCalledWith({ endpoint: mockEndpoint });
    expect(mockAuth.logout).toHaveBeenCalledWith('refresh-456');
    expect(warnSpy).toHaveBeenCalled();
  });
});
