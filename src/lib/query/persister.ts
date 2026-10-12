import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { AsyncStorage } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';

const idbStorage: AsyncStorage<string> = {
  getItem: async (key: string) => {
    try {
      const val = await get<string>(key);
      return val ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await set(key, value);
    } catch {
      // Fallback if IndexedDB storage quota or permission fails
    }
  },
  removeItem: async (key: string) => {
    try {
      await del(key);
    } catch {
      // Fallback
    }
  },
};

export const createIdbPersister = (idbKey = 'cute-teachy-query-cache') => {
  if (typeof window === 'undefined') return undefined;
  return createAsyncStoragePersister({
    storage: idbStorage,
    key: idbKey,
    throttleTime: 1000,
  });
};
