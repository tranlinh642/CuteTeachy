import { describe, expect, it } from 'vitest';
import {
  evaluatePushDecision,
  isIosDevice,
  isPushSupported,
  isStandaloneMode,
  serializePushSubscription,
  urlBase64ToUint8Array,
} from './push-helpers';

describe('push-helpers', () => {
  describe('urlBase64ToUint8Array', () => {
    it('converts base64url string to Uint8Array', () => {
      // "hello" in base64 is "aGVsbG8="
      const bytes = urlBase64ToUint8Array('aGVsbG8');
      const decoded = String.fromCharCode(...bytes);
      expect(decoded).toBe('hello');
    });

    it('handles base64 strings with - and _', () => {
      // test with url safe characters - and _
      const bytes = urlBase64ToUint8Array('-_');
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });
  });

  describe('isIosDevice', () => {
    it('detects iPhone Safari', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      expect(isIosDevice(ua)).toBe(true);
    });

    it('detects iPad Safari', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      expect(isIosDevice(ua)).toBe(true);
    });

    it('returns false for Chrome on iOS (crios) or Firefox on iOS (fxios)', () => {
      const crios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';
      expect(isIosDevice(crios)).toBe(false);

      const fxios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 FxiOS/120.0 Mobile/15E148 Safari/604.1';
      expect(isIosDevice(fxios)).toBe(false);
    });

    it('returns false for Android and desktop browsers', () => {
      const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';
      expect(isIosDevice(android)).toBe(false);

      const desktopMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
      expect(isIosDevice(desktopMac)).toBe(false);
    });
  });

  describe('isStandaloneMode', () => {
    it('returns true when display-mode is standalone', () => {
      const win = {
        matchMedia: (query: string) => ({
          matches: query === '(display-mode: standalone)',
        }),
        navigator: {},
      } as unknown as Window;

      expect(isStandaloneMode(win)).toBe(true);
    });

    it('returns true when navigator.standalone is true (iOS legacy)', () => {
      const win = {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      } as unknown as Window;

      expect(isStandaloneMode(win)).toBe(true);
    });

    it('returns false when neither matchMedia nor navigator.standalone is true', () => {
      const win = {
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
      } as unknown as Window;

      expect(isStandaloneMode(win)).toBe(false);
    });
  });

  describe('isPushSupported', () => {
    it('returns true when Notification, serviceWorker and PushManager exist', () => {
      const win = {
        Notification: {},
        navigator: { serviceWorker: {} },
        PushManager: {},
      } as unknown as Window;

      expect(isPushSupported(win)).toBe(true);
    });

    it('returns false when any required API is missing', () => {
      const winWithoutPush = {
        Notification: {},
        navigator: { serviceWorker: {} },
      } as unknown as Window;

      expect(isPushSupported(winWithoutPush)).toBe(false);
    });
  });

  describe('evaluatePushDecision', () => {
    it('returns unsupported when push APIs are not supported', () => {
      const result = evaluatePushDecision({
        isSupported: false,
        isIos: false,
        isStandalone: false,
        permission: 'default',
      });
      expect(result).toBe('unsupported');
    });

    it('returns ios_needs_pwa when device is iOS and not in standalone mode', () => {
      const result = evaluatePushDecision({
        isSupported: true,
        isIos: true,
        isStandalone: false,
        permission: 'default',
      });
      expect(result).toBe('ios_needs_pwa');
    });

    it('returns can_prompt when device is iOS in standalone mode with default permission', () => {
      const result = evaluatePushDecision({
        isSupported: true,
        isIos: true,
        isStandalone: true,
        permission: 'default',
      });
      expect(result).toBe('can_prompt');
    });

    it('returns permission_denied when permission is denied regardless of device', () => {
      const result = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: true,
        permission: 'denied',
      });
      expect(result).toBe('permission_denied');
    });

    it('returns already_granted when permission is granted', () => {
      const result = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: true,
        permission: 'granted',
      });
      expect(result).toBe('already_granted');
    });

    it('returns can_prompt when browser is supported and permission is default', () => {
      const result = evaluatePushDecision({
        isSupported: true,
        isIos: false,
        isStandalone: false,
        permission: 'default',
      });
      expect(result).toBe('can_prompt');
    });
  });

  describe('serializePushSubscription', () => {
    it('uses subscription.toJSON() when available', () => {
      const mockSub = {
        endpoint: 'https://push.example.com/sub/abc',
        toJSON: () => ({
          endpoint: 'https://push.example.com/sub/abc',
          keys: {
            p256dh: 'p256dh_value',
            auth: 'auth_value',
          },
        }),
      } as unknown as PushSubscription;

      const result = serializePushSubscription(mockSub);
      expect(result).toEqual({
        endpoint: 'https://push.example.com/sub/abc',
        keys: {
          p256dh: 'p256dh_value',
          auth: 'auth_value',
        },
      });
    });

    it('falls back to getKey when toJSON does not return keys', () => {
      const p256dhBuf = new Uint8Array([1, 2, 3]).buffer;
      const authBuf = new Uint8Array([4, 5, 6]).buffer;

      const mockSub = {
        endpoint: 'https://push.example.com/sub/abc',
        getKey: (name: string) => (name === 'p256dh' ? p256dhBuf : authBuf),
      } as unknown as PushSubscription;

      const result = serializePushSubscription(mockSub);
      expect(result.endpoint).toBe('https://push.example.com/sub/abc');
      expect(result.keys.p256dh).toBe(btoa(String.fromCharCode(1, 2, 3)));
      expect(result.keys.auth).toBe(btoa(String.fromCharCode(4, 5, 6)));
    });
  });
});
