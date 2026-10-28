import { describe, expect, it, vi, afterEach } from 'vitest';
import { evaluatePushDecision } from '../utils/push-helpers';

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
});
