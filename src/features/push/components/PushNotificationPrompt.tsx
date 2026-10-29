'use client';

import { useState } from 'react';
import { usePushNotification } from '../hooks/use-push-notification';
import { PushPromptBanner } from './PushPromptBanner';
import { PushPermissionDialog } from './PushPermissionDialog';
import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/lib/api';
import { selectIsAuthenticated, useSessionStore } from '@/stores';

export interface PushNotificationPromptProps {
  readonly hasCreatedItemOverride?: boolean;
  readonly isAuthenticatedOverride?: boolean;
}

export function PushNotificationPrompt({
  hasCreatedItemOverride,
  isAuthenticatedOverride,
}: PushNotificationPromptProps = {}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const sessionAuth = useSessionStore(selectIsAuthenticated);
  const isAuthenticated = isAuthenticatedOverride ?? sessionAuth;
  const pushNotification = usePushNotification();
  const { tasks: taskService, timetableSlots: slotService, notes: noteService } = useServices();

  const { data: hasCreatedItem } = useQuery({
    queryKey: ['push-prompt-check'],
    queryFn: async () => {
      try {
        const [taskList, slotList, noteList] = await Promise.all([
          taskService.list(),
          slotService.list(),
          noteService ? noteService.list() : Promise.resolve({ items: [] }),
        ]);
        const timedTasks = (taskList.items ?? []).filter(
          (task) => task.time != null && task.time !== '',
        );
        const slotCount = slotList.items?.length ?? 0;
        const dueNotes = (noteList.items ?? []).filter(
          (note) => note.dueDate != null && note.dueDate !== '',
        );
        return timedTasks.length > 0 || slotCount > 0 || dueNotes.length > 0;
      } catch {
        return false;
      }
    },
    enabled: isAuthenticated && hasCreatedItemOverride === undefined,
    staleTime: 60_000,
  });

  const hasItem = hasCreatedItemOverride !== undefined ? hasCreatedItemOverride : Boolean(hasCreatedItem);

  const canShowDecision =
    (pushNotification.isSupported && pushNotification.decision === 'can_prompt') ||
    pushNotification.decision === 'ios_needs_pwa';

  const shouldShow =
    isAuthenticated &&
    !isDismissed &&
    hasItem &&
    canShowDecision;

  if (!shouldShow && !pushNotification.isDialogOpen) {
    return null;
  }

  return (
    <>
      {shouldShow && (
        <PushPromptBanner
          onEnable={pushNotification.openDialog}
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
