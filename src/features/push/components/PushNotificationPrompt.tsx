'use client';

import { useState } from 'react';
import { usePushNotification } from '../hooks/use-push-notification';
import { PushPromptBanner } from './PushPromptBanner';
import { PushPermissionDialog } from './PushPermissionDialog';
import { selectIsAuthenticated, useSessionStore } from '@/stores';
import type { PushDecision } from '../utils/push-helpers';

export interface PushNotificationPromptProps {
  readonly hasCreatedItemOverride?: boolean;
  readonly isAuthenticatedOverride?: boolean;
}

export interface BannerEnableTarget {
  readonly decision: PushDecision;
  readonly confirmPermission: () => Promise<boolean>;
  readonly openDialog: () => void;
}

/**
 * SPEC-006 (lines 30, 72-75):
 * - On Android / Desktop / iOS standalone PWA (`can_prompt`), trigger `confirmPermission()`
 *   (`Notification.requestPermission()`) directly in 1 tap within the user gesture.
 * - On iOS browser outside standalone mode (`ios_needs_pwa`), open the 3-step Home Screen guide dialog.
 */
export async function triggerProactivePushEnable(target: BannerEnableTarget): Promise<void> {
  if (target.decision === 'can_prompt') {
    const granted = await target.confirmPermission();
    if (!granted) {
      target.openDialog();
    }
    return;
  }
  target.openDialog();
}

export function PushNotificationPrompt({
  isAuthenticatedOverride,
}: PushNotificationPromptProps = {}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const sessionAuth = useSessionStore(selectIsAuthenticated);
  const isAuthenticated = isAuthenticatedOverride ?? sessionAuth;
  const pushNotification = usePushNotification();

  const canShowDecision =
    (pushNotification.isSupported && pushNotification.decision === 'can_prompt') ||
    pushNotification.decision === 'ios_needs_pwa';

  const shouldShow =
    isAuthenticated &&
    !isDismissed &&
    canShowDecision;

  if (!shouldShow && !pushNotification.isDialogOpen) {
    return null;
  }

  const handleEnable = () => {
    void triggerProactivePushEnable(pushNotification);
  };

  return (
    <>
      {shouldShow && (
        <PushPromptBanner
          onEnable={handleEnable}
          onDismiss={() => setIsDismissed(true)}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40"
        />
      )}
      <PushPermissionDialog
        open={pushNotification.isDialogOpen}
        step={pushNotification.dialogStep}
        isSubscribing={pushNotification.isSubscribing}
        error={pushNotification.error}
        onClose={pushNotification.closeDialog}
        onConfirm={pushNotification.confirmPermission}
      />
    </>
  );
}
