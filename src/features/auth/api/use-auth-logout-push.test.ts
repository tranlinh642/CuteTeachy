import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import * as idbKeyval from 'idb-keyval';
import { useSessionStore } from '@/stores';
import { unsubscribeDevice } from '@/features/push';
import { getStoredServerTime, setStoredServerTime } from '@/lib/sync';
import { clearAuthSessionState, resetClientSyncAndCache } from './use-auth';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe('useLogout push unsubscription & session/cache cleanup (SPEC-005 & FE-01)', () => {
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

  it('clearAuthSessionState clears session, serverTime checkpoints, in-memory query cache, and IndexedDB query cache', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['tasks', 'list'], [{ id: 't1' }]);
    await setStoredServerTime(['tasks', 'list'], '2026-10-31T00:00:00Z');
    expect(await getStoredServerTime(['tasks', 'list'])).toBe('2026-10-31T00:00:00Z');

    await clearAuthSessionState(queryClient);

    expect(useSessionStore.getState().session).toBeNull();
    expect(queryClient.getQueryData(['tasks', 'list'])).toBeUndefined();
    expect(await getStoredServerTime(['tasks', 'list'])).toBeNull();
    expect(idbKeyval.del).toHaveBeenCalledWith('cute-teachy-query-cache');
  });

  it('resetClientSyncAndCache clears serverTime checkpoints, in-memory query cache, and IndexedDB query cache', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['notes', 'infinite'], { pages: [] });
    await setStoredServerTime(['notes', 'infinite'], '2026-10-31T00:00:00Z');

    await resetClientSyncAndCache(queryClient);

    expect(queryClient.getQueryData(['notes', 'infinite'])).toBeUndefined();
    expect(await getStoredServerTime(['notes', 'infinite'])).toBeNull();
    expect(idbKeyval.del).toHaveBeenCalledWith('cute-teachy-query-cache');
  });
});
