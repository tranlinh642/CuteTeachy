'use client';

import { useSyncExternalStore } from 'react';

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getServerSnapshot);
}
