'use client';

import { useCallback, useEffect, useState } from 'react';
import { useServices } from '@/lib/api';
import { useSettings, useUpdateSettings } from '@/features/settings';
import {
  evaluatePushDecision,
  isIosDevice,
  isPushSupported,
  isStandaloneMode,
  serializePushSubscription,
  urlBase64ToUint8Array,
  type PushDecision,
} from '../utils/push-helpers';

export type PushDialogStep = 'explanation' | 'ios_guide' | 'denied_guide';

export interface UsePushNotificationOptions {
  readonly autoCheckSubscription?: boolean;
}

export function usePushNotification(options: UsePushNotificationOptions = {}) {
  const { autoCheckSubscription = true } = options;
  const { push } = useServices();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

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

  // Check active subscription if supported (pure read, never prompts user)
  useEffect(() => {
    if (!autoCheckSubscription || !isSupported || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let active = true;
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

    return () => {
      active = false;
    };
  }, [autoCheckSubscription, isSupported]);

  const decision: PushDecision = evaluatePushDecision({
    isSupported,
    isIos,
    isStandalone,
    permission,
  });

  const openDialog = useCallback(() => {
    setError(null);
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
      // 1. Request permission
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

      // 3. Subscribe with PushManager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      // 4. Send subscription to BE
      const payload = serializePushSubscription(sub);
      await push.createPushSubscription(payload);

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
  }, [push, updateSettings]);

  const unsubscribeDevice = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub?.endpoint) {
        await push.deletePushSubscription({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.warn('[Push] Unsubscribe error:', err);
    }
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
  };
}
