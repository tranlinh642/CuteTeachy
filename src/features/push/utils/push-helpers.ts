import type { CreatePushSubscriptionInput } from '@/types';

export type PushDecision =
  | 'unsupported'
  | 'ios_needs_pwa'
  | 'permission_denied'
  | 'can_prompt'
  | 'already_granted';

/**
 * Converts a URL-safe base64 string to a Uint8Array suitable for applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detects whether the current device is iOS (Safari on iPhone, iPad, iPod)
 * where Web Push requires the app to be added to the Home Screen (standalone).
 */
export function isIosDevice(userAgent?: string): boolean {
  const ua = (userAgent ?? (typeof window !== 'undefined' ? window.navigator?.userAgent ?? '' : '')).toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
}

/**
 * Checks whether the app is running in standalone mode (PWA installed).
 */
export function isStandaloneMode(win?: Window): boolean {
  const targetWindow = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!targetWindow) return false;

  const isStandaloneMedia = targetWindow.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
  const isIosStandalone = (targetWindow.navigator as unknown as { standalone?: boolean })?.standalone === true;
  return isStandaloneMedia || isIosStandalone;
}

/**
 * Checks whether the browser supports Notifications, Service Workers, and PushManager.
 */
export function isPushSupported(win?: Window): boolean {
  const targetWindow = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!targetWindow) return false;

  return (
    'Notification' in targetWindow &&
    'serviceWorker' in targetWindow.navigator &&
    'PushManager' in targetWindow
  );
}

/**
 * Evaluates the appropriate push permission decision flow.
 */
export function evaluatePushDecision(options: {
  isSupported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  permission: NotificationPermission;
}): PushDecision {
  if (!options.isSupported) {
    return 'unsupported';
  }
  if (options.isIos && !options.isStandalone) {
    return 'ios_needs_pwa';
  }
  if (options.permission === 'denied') {
    return 'permission_denied';
  }
  if (options.permission === 'granted') {
    return 'already_granted';
  }
  return 'can_prompt';
}

/**
 * Serializes a PushSubscription into CreatePushSubscriptionInput payload.
 */
export function serializePushSubscription(subscription: PushSubscription): CreatePushSubscriptionInput {
  const json = subscription.toJSON ? subscription.toJSON() : null;
  if (json?.endpoint && json?.keys?.p256dh && json?.keys?.auth) {
    return {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    };
  }

  const p256dhKey = subscription.getKey ? subscription.getKey('p256dh') : null;
  const authKey = subscription.getKey ? subscription.getKey('auth') : null;

  const toBase64 = (buf: ArrayBuffer | null): string => {
    if (!buf) return '';
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: toBase64(p256dhKey),
      auth: toBase64(authKey),
    },
  };
}

export interface UnsubscribeDeviceOptions {
  readonly window?: Window;
  readonly deletePushSubscription?: (payload: { endpoint: string }) => Promise<unknown>;
}

/**
 * Unsubscribes the current device:
 * 1. Checks serviceWorker availability.
 * 2. Gets the active subscription.
 * 3. Deletes the subscription on the backend if deletePushSubscription callback is provided.
 * 4. Unsubscribes the PushSubscription locally in the browser.
 * Never throws an unhandled exception to prevent blocking caller flows (e.g. logout).
 */
export async function unsubscribeDevice(options?: UnsubscribeDeviceOptions): Promise<boolean> {
  const win = options?.window ?? (typeof window !== 'undefined' ? window : undefined);
  const nav = win?.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);

  if (!nav || !('serviceWorker' in nav)) {
    return false;
  }

  try {
    const reg = await nav.serviceWorker.ready;
    const sub = await reg?.pushManager?.getSubscription();
    if (!sub) {
      return false;
    }

    if (sub.endpoint && options?.deletePushSubscription) {
      try {
        await options.deletePushSubscription({ endpoint: sub.endpoint });
      } catch (err) {
        // Network errors must not block the flow
        console.warn('[Push] Failed to delete push subscription on server:', err);
      }
    }

    try {
      if (typeof sub.unsubscribe === 'function') {
        await sub.unsubscribe();
      }
    } catch (err) {
      console.warn('[Push] Failed to unsubscribe push manager:', err);
    }

    return true;
  } catch (err) {
    console.warn('[Push] Unsubscribe device error:', err);
    return false;
  }
}
