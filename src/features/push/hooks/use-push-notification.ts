'use client';

import { useCallback, useEffect, useState } from 'react';
import { useServices } from '@/lib/api';
import { useSettings, useUpdateSettings } from '@/features/settings';
import { selectCurrentUser, useSessionStore } from '@/stores';
import type { CreatePushSubscriptionInput, TestPushNotificationResponse } from '@/types';
import {
  evaluatePushDecision,
  isIosDevice,
  isPushSupported,
  isStandaloneMode,
  serializePushSubscription,
  unsubscribeDevice as unsubscribeDeviceHelper,
  urlBase64ToUint8Array,
  type PushDecision,
} from '../utils/push-helpers';

export type PushDialogStep = 'explanation' | 'ios_guide' | 'denied_guide';

export interface UsePushNotificationOptions {
  readonly autoCheckSubscription?: boolean;
}

const SW_READY_TIMEOUT_MS = 10_000;
const PUSH_SUBSCRIBE_TIMEOUT_MS = 15_000;

let lastSyncedAccountEndpoint: string | null = null;
let inFlightSyncKey: string | null = null;
let inFlightSyncPromise: Promise<boolean> | null = null;

export function resetPushSyncStateForTest(): void {
  lastSyncedAccountEndpoint = null;
  inFlightSyncKey = null;
  inFlightSyncPromise = null;
}

export interface SyncGrantedPushSubscriptionDeps {
  readonly accountId: string;
  readonly getRegistration: () => Promise<ServiceWorkerRegistration | null>;
  readonly getVapidPublicKey: () => Promise<{ publicKey: string }>;
  readonly createPushSubscription: (payload: CreatePushSubscriptionInput) => Promise<unknown>;
}

/**
 * Silently ensures an already-granted device has an active PushSubscription
 * and that its endpoint is registered in the backend for the current account.
 * Deduplicated per (accountId, endpoint) across all mounted hook instances.
 */
export async function syncGrantedPushSubscription(
  deps: SyncGrantedPushSubscriptionDeps,
): Promise<boolean> {
  const reg = await deps.getRegistration();
  if (!reg?.pushManager) {
    return false;
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // Device already has OS-level Notification.permission === 'granted'
    // (e.g., user logged out & logged back in on iOS PWA, or SW refreshed).
    // Attempt silent re-subscribe so reminders keep arriving without re-prompting.
    try {
      const { publicKey } = await deps.getVapidPublicKey();
      if (!publicKey) return false;
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;
      sub = await withTimeout(
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }),
        PUSH_SUBSCRIBE_TIMEOUT_MS,
        'Push re-subscription timed out',
      );
    } catch {
      return false;
    }
  }

  const payload = serializePushSubscription(sub);
  const syncKey = `${deps.accountId}:${payload.endpoint}`;

  if (lastSyncedAccountEndpoint === syncKey) {
    return true;
  }

  if (inFlightSyncPromise && inFlightSyncKey === syncKey) {
    return inFlightSyncPromise;
  }

  inFlightSyncKey = syncKey;
  inFlightSyncPromise = deps
    .createPushSubscription(payload)
    .then(() => {
      lastSyncedAccountEndpoint = syncKey;
      return true;
    })
    .catch(() => false)
    .finally(() => {
      if (inFlightSyncKey === syncKey) {
        inFlightSyncKey = null;
        inFlightSyncPromise = null;
      }
    });

  return inFlightSyncPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Trình duyệt không hỗ trợ Service Worker cho thông báo đẩy.');
  }

  let reg = await navigator.serviceWorker.getRegistration?.();
  if (!reg && typeof navigator.serviceWorker.register === 'function') {
    try {
      reg = await withTimeout(
        navigator.serviceWorker.register('/sw.js'),
        SW_READY_TIMEOUT_MS,
        'Không thể đăng ký Service Worker (quá thời gian chờ).',
      );
    } catch {
      // Fall through to navigator.serviceWorker.ready check with timeout
    }
  }

  return withTimeout(
    navigator.serviceWorker.ready,
    SW_READY_TIMEOUT_MS,
    'Service Worker chưa sẵn sàng. Hãy tải lại trang hoặc mở ứng dụng trên bản web HTTPS (PWA) rồi thử lại.',
  );
}

export function usePushNotification(options: UsePushNotificationOptions = {}) {
  const { autoCheckSubscription = true } = options;
  const { push } = useServices();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const currentUser = useSessionStore(selectCurrentUser);
  const accountId = currentUser?.id ?? null;

  const [isSupported, setIsSupported] = useState<boolean>(() => isPushSupported());
  const [isIos, setIsIos] = useState<boolean>(() => isIosDevice());
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneMode());
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<PushDialogStep>('explanation');
  const [error, setError] = useState<string | null>(null);

  // Sync environment detection on client mount
  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);
    setIsIos(isIosDevice());
    setIsStandalone(isStandaloneMode());

    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const decision: PushDecision = evaluatePushDecision({
    isSupported,
    isIos,
    isStandalone,
    permission,
  });

  // Reset per-account sync deduplication when user logs out
  useEffect(() => {
    if (!accountId) {
      lastSyncedAccountEndpoint = null;
    }
  }, [accountId]);

  // Check active subscription if supported and silently re-sync granted devices with BE
  useEffect(() => {
    if (!autoCheckSubscription || !isSupported || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let active = true;
    const canSilentSync =
      decision === 'already_granted' &&
      Boolean(accountId) &&
      settings?.pushEnabled === true;

    if (canSilentSync && accountId) {
      void syncGrantedPushSubscription({
        accountId,
        getRegistration: () =>
          ensureServiceWorkerReady().catch(() => null),
        getVapidPublicKey: () => push.getVapidPublicKey(),
        createPushSubscription: (payload) => push.createPushSubscription(payload),
      }).then((synced) => {
        if (active) {
          setIsSubscribed(synced);
        }
      });
    } else {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (active) {
            setIsSubscribed(Boolean(sub));
          }
        })
        .catch(() => {
          // Ignore check failure on unsupported environments
        });
    }

    return () => {
      active = false;
    };
  }, [autoCheckSubscription, isSupported, decision, accountId, settings?.pushEnabled, push]);

  const openDialog = useCallback(() => {
    const currentDecision = evaluatePushDecision({
      isSupported: isPushSupported(),
      isIos: isIosDevice(),
      isStandalone: isStandaloneMode(),
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    });

    if (currentDecision === 'ios_needs_pwa') {
      setDialogStep('ios_guide');
    } else if (currentDecision === 'permission_denied') {
      setDialogStep('denied_guide');
    } else {
      setDialogStep('explanation');
    }
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setError(null);
  }, []);

  const confirmPermission = useCallback(async (): Promise<boolean> => {
    setError(null);

    const currentDecision = evaluatePushDecision({
      isSupported: isPushSupported(),
      isIos: isIosDevice(),
      isStandalone: isStandaloneMode(),
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    });

    if (currentDecision === 'ios_needs_pwa') {
      setDialogStep('ios_guide');
      return false;
    }

    if (currentDecision === 'permission_denied') {
      setDialogStep('denied_guide');
      return false;
    }

    if (!isPushSupported() || typeof window === 'undefined' || !('Notification' in window)) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }

    setIsSubscribing(true);

    try {
      // 1. Request permission directly inside user gesture stack
      const reqPermission = await Notification.requestPermission();
      setPermission(reqPermission);

      if (reqPermission === 'denied') {
        setDialogStep('denied_guide');
        setIsSubscribing(false);
        return false;
      }

      if (reqPermission !== 'granted') {
        setIsSubscribing(false);
        return false;
      }

      // 2. Fetch VAPID public key
      const { publicKey } = await push.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('Máy chủ chưa cấu hình VAPID public key cho thông báo đẩy.');
      }

      // 3. Ensure Service Worker is registered & active (with timeout so UI never hangs)
      const reg = await ensureServiceWorkerReady();
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;

      let sub: PushSubscription;
      try {
        sub = await withTimeout(
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }),
          PUSH_SUBSCRIBE_TIMEOUT_MS,
          'Quá thời gian kết nối dịch vụ thông báo đẩy của trình duyệt. Vui lòng thử lại.',
        );
      } catch (subErr) {
        // Nếu subscription cũ có VAPID key khác → huỷ và đăng ký lại tự động
        const existing = await reg.pushManager.getSubscription().catch(() => null);
        if (existing) {
          await existing.unsubscribe().catch(() => {});
          sub = await withTimeout(
            reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            }),
            PUSH_SUBSCRIBE_TIMEOUT_MS,
            'Quá thời gian kết nối dịch vụ thông báo đẩy của trình duyệt. Vui lòng thử lại.',
          );
        } else {
          throw subErr;
        }
      }

      // 4. Send subscription to BE
      const payload = serializePushSubscription(sub);
      await push.createPushSubscription(payload);
      if (accountId) {
        lastSyncedAccountEndpoint = `${accountId}:${payload.endpoint}`;
      }

      // 5. Update settings to pushEnabled: true
      await updateSettings.mutateAsync({ pushEnabled: true });

      setIsSubscribed(true);
      setIsSubscribing(false);
      setIsDialogOpen(false);
      return true;
    } catch (err) {
      console.error('[Push] Failed to register push subscription:', err);
      setError(err instanceof Error ? err.message : 'Subscription failed');
      setIsSubscribing(false);
      return false;
    }
  }, [accountId, push, updateSettings]);

  const unsubscribeDevice = useCallback(async () => {
    lastSyncedAccountEndpoint = null;
    const unsubscribed = await unsubscribeDeviceHelper({
      deletePushSubscription: (input) => push.deletePushSubscription(input),
    });
    if (unsubscribed) {
      setIsSubscribed(false);
    }
  }, [push]);

  const sendTestNotification = useCallback(async (): Promise<TestPushNotificationResponse> => {
    return push.sendTestNotification();
  }, [push]);

  return {
    isSupported,
    isIos,
    isStandalone,
    permission,
    decision,
    isSubscribed,
    isSubscribing,
    isDialogOpen,
    dialogStep,
    error,
    pushEnabled: settings?.pushEnabled ?? false,
    openDialog,
    closeDialog,
    confirmPermission,
    unsubscribeDevice,
    sendTestNotification,
  };
}
