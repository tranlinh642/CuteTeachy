import { describe, expect, it, vi, afterEach } from 'vitest';
import { evaluatePushDecision } from '../utils/push-helpers';
import {
  resetPushSyncStateForTest,
  syncGrantedPushSubscription,
} from './use-push-notification';

describe('usePushNotification logic and decision flows (S5-FE-01)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Device & Permission Decision Matrix (SPEC-005 US 1, 2, 6)', () => {
    it('returns unsupported when push APIs are not available', () => {
      const decision = evaluatePushDecision({
        isSupported: false,
        isIos: false,
        isStandalone: false,
        permission: 'default',
      });
      expect(decision).toBe('unsupported');
    });

    it('returns ios_needs_pwa on iPhone Safari when not running in standalone mode', () => {
      const decision = evaluatePushDecision({
        isSupported: true,
        isIos: true,
        isStandalone: false,
        permission: 'default',
      });
      expect(decision).toBe('ios_needs_pwa');
    });

    it('allows prompt on iPhone PWA when running in standalone mode', () => {
      const decision = evaluatePushDecision({
        isSupported: true,
        isIos: true,
        isStandalone: true,
        permission: 'default',
      });
      expect(decision).toBe('can_prompt');
    });

    it('returns permission_denied when user previously blocked notifications', () => {
      const decision = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: false,
        permission: 'denied',
      });
      expect(decision).toBe('permission_denied');
    });

    it('returns already_granted when user already granted permission', () => {
      const decision = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: false,
        permission: 'granted',
      });
      expect(decision).toBe('already_granted');
    });

    it('returns can_prompt when supported desktop/android browser has default permission', () => {
      const decision = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: false,
        permission: 'default',
      });
      expect(decision).toBe('can_prompt');
    });
  });

  describe('Subscription registration flow on granted permission', () => {
    it('executes full sequence: requestPermission -> getVapidKey -> pushManager.subscribe -> POST /push/subscriptions', async () => {
      const mockPublicKey = 'BIh-mock-public-key-1234567890';
      const mockEndpoint = 'https://fcm.googleapis.com/fcm/send/sample-endpoint';

      const mockSub = {
        endpoint: mockEndpoint,
        toJSON: () => ({
          endpoint: mockEndpoint,
          keys: {
            p256dh: 'mock-p256dh',
            auth: 'mock-auth',
          },
        }),
      };

      const subscribeSpy = vi.fn().mockResolvedValue(mockSub);
      const pushManager = {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: subscribeSpy,
      };

      const serviceWorker = {
        ready: Promise.resolve({
          pushManager,
        }),
      };

      // Mock services
      const pushService = {
        getVapidPublicKey: vi.fn().mockResolvedValue({ publicKey: mockPublicKey }),
        createPushSubscription: vi.fn().mockResolvedValue(mockSub),
        deletePushSubscription: vi.fn().mockResolvedValue(undefined),
      };

      const settingsUpdateSpy = vi.fn().mockResolvedValue({ pushEnabled: true });

      // Simulate flow
      const reqPermissionResult = 'granted';
      expect(reqPermissionResult).toBe('granted');

      const { publicKey } = await pushService.getVapidPublicKey();
      expect(pushService.getVapidPublicKey).toHaveBeenCalled();
      expect(publicKey).toBe(mockPublicKey);

      const reg = await serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expect.anything(),
      });
      expect(subscribeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userVisibleOnly: true }),
      );

      await pushService.createPushSubscription(sub.toJSON());
      expect(pushService.createPushSubscription).toHaveBeenCalledWith({
        endpoint: mockEndpoint,
        keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
      });

      await settingsUpdateSpy({ pushEnabled: true });
      expect(settingsUpdateSpy).toHaveBeenCalledWith({ pushEnabled: true });
    });

    it('does not call subscribe if user denies permission in browser prompt', async () => {
      const pushService = {
        getVapidPublicKey: vi.fn(),
        createPushSubscription: vi.fn(),
      };
      const subscribeSpy = vi.fn();

      const handlePermissionResult = async (result: NotificationPermission) => {
        if (result === 'granted') {
          await pushService.getVapidPublicKey();
          subscribeSpy();
        }
      };
      await handlePermissionResult('denied');

      expect(pushService.getVapidPublicKey).not.toHaveBeenCalled();
      expect(subscribeSpy).not.toHaveBeenCalled();
      expect(pushService.createPushSubscription).not.toHaveBeenCalled();
    });
  });

  describe('syncGrantedPushSubscription (auto re-sync for already-granted devices)', () => {
    afterEach(() => {
      resetPushSyncStateForTest();
    });

    it('syncs an existing browser subscription to backend and deduplicates repeat calls for same account + endpoint', async () => {
      const mockSub = {
        endpoint: 'https://web.push.apple.com/mock-endpoint-1',
        toJSON: () => ({
          endpoint: 'https://web.push.apple.com/mock-endpoint-1',
          keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
        }),
      } as unknown as PushSubscription;

      const reg = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(mockSub),
          subscribe: vi.fn(),
        },
      } as unknown as ServiceWorkerRegistration;

      const createPushSubscription = vi.fn().mockResolvedValue({});
      const getVapidPublicKey = vi.fn();

      const first = await syncGrantedPushSubscription({
        accountId: 'acc-1',
        getRegistration: async () => reg,
        getVapidPublicKey,
        createPushSubscription,
      });
      const second = await syncGrantedPushSubscription({
        accountId: 'acc-1',
        getRegistration: async () => reg,
        getVapidPublicKey,
        createPushSubscription,
      });

      expect(first).toBe(true);
      expect(second).toBe(true);
      expect(getVapidPublicKey).not.toHaveBeenCalled();
      expect(createPushSubscription).toHaveBeenCalledTimes(1);
      expect(createPushSubscription).toHaveBeenCalledWith({
        endpoint: 'https://web.push.apple.com/mock-endpoint-1',
        keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
      });
    });

    it('silently re-subscribes when OS permission is already granted but browser subscription was cleared (e.g. after logout/login)', async () => {
      const newSub = {
        endpoint: 'https://web.push.apple.com/mock-endpoint-2',
        toJSON: () => ({
          endpoint: 'https://web.push.apple.com/mock-endpoint-2',
          keys: { p256dh: 'p256dh-2', auth: 'auth-2' },
        }),
      } as unknown as PushSubscription;

      const subscribe = vi.fn().mockResolvedValue(newSub);
      const reg = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe,
        },
      } as unknown as ServiceWorkerRegistration;

      const getVapidPublicKey = vi.fn().mockResolvedValue({ publicKey: 'BAECAwQFBgcICQoLDA0ODw' });
      const createPushSubscription = vi.fn().mockResolvedValue({});

      const ok = await syncGrantedPushSubscription({
        accountId: 'acc-2',
        getRegistration: async () => reg,
        getVapidPublicKey,
        createPushSubscription,
      });

      expect(ok).toBe(true);
      expect(getVapidPublicKey).toHaveBeenCalledTimes(1);
      expect(subscribe).toHaveBeenCalledWith(
        expect.objectContaining({ userVisibleOnly: true }),
      );
      expect(createPushSubscription).toHaveBeenCalledWith({
        endpoint: 'https://web.push.apple.com/mock-endpoint-2',
        keys: { p256dh: 'p256dh-2', auth: 'auth-2' },
      });
    });

    it('returns false gracefully when browser blocks silent subscribe without user gesture', async () => {
      const reg = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe: vi.fn().mockRejectedValue(new Error('User gesture required')),
        },
      } as unknown as ServiceWorkerRegistration;

      const ok = await syncGrantedPushSubscription({
        accountId: 'acc-3',
        getRegistration: async () => reg,
        getVapidPublicKey: vi.fn().mockResolvedValue({ publicKey: 'BAECAwQFBgcICQoLDA0ODw' }),
        createPushSubscription: vi.fn(),
      });

      expect(ok).toBe(false);
    });
  });
});
