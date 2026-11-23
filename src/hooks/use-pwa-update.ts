'use client';

import { useSyncExternalStore } from 'react';
import {
  pwaUpdateManager,
  type PwaUpdateSnapshot,
} from '@/lib/pwa/pwa-update-manager';

const SERVER_SNAPSHOT: PwaUpdateSnapshot = {
  hasUpdate: false,
  isDismissed: false,
  isUpdating: false,
  checkStatus: 'idle',
};

export function usePwaUpdate() {
  const snapshot = useSyncExternalStore(
    pwaUpdateManager.subscribe,
    pwaUpdateManager.getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  return {
    ...snapshot,
    applyUpdate: () => pwaUpdateManager.applyUpdate(),
    checkForUpdate: () => pwaUpdateManager.checkForUpdate(),
    dismiss: () => pwaUpdateManager.dismiss(),
  };
}
