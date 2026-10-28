import { persistentStorageProxy, type KeyValueStorage } from '@/stores';

const STORAGE_PREFIX = 'cute-teachy:sync:server-time:';
const INDEX_KEY = 'cute-teachy:sync:server-time-index';

export const serializeQueryKey = (queryKey: readonly unknown[] | string): string => {
  if (typeof queryKey === 'string') return queryKey;
  try {
    return JSON.stringify(queryKey);
  } catch {
    return String(queryKey);
  }
};

export const getServerTimeStorageKey = (queryKey: readonly unknown[] | string): string => {
  return `${STORAGE_PREFIX}${serializeQueryKey(queryKey)}`;
};

const getRegisteredKeys = async (storage: KeyValueStorage): Promise<string[]> => {
  try {
    const raw = await storage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRegisteredKeys = async (storage: KeyValueStorage, keys: string[]): Promise<void> => {
  try {
    await storage.setItem(INDEX_KEY, JSON.stringify(keys));
  } catch {
    // Storage quota or permission error ignored
  }
};

/**
 * Retrieves the stored `serverTime` checkpoint for a specific list query key.
 */
export const getStoredServerTime = async (
  queryKey: readonly unknown[] | string,
  storage: KeyValueStorage = persistentStorageProxy,
): Promise<string | null> => {
  try {
    const key = getServerTimeStorageKey(queryKey);
    const value = await storage.getItem(key);
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

/**
 * Persists the `serverTime` checkpoint for a specific list query key.
 */
export const setStoredServerTime = async (
  queryKey: readonly unknown[] | string,
  serverTime: string,
  storage: KeyValueStorage = persistentStorageProxy,
): Promise<void> => {
  try {
    const storageKey = getServerTimeStorageKey(queryKey);
    await storage.setItem(storageKey, serverTime);

    // Track in index for batch clearing if needed
    const currentKeys = await getRegisteredKeys(storage);
    if (!currentKeys.includes(storageKey)) {
      await saveRegisteredKeys(storage, [...currentKeys, storageKey]);
    }
  } catch {
    // Storage quota or permission error ignored
  }
};

/**
 * Removes the stored `serverTime` checkpoint for a specific list query key.
 * Called when updatedSince is rejected by the server (400 validation / > 30 days).
 */
export const removeStoredServerTime = async (
  queryKey: readonly unknown[] | string,
  storage: KeyValueStorage = persistentStorageProxy,
): Promise<void> => {
  try {
    const storageKey = getServerTimeStorageKey(queryKey);
    await storage.removeItem(storageKey);

    const currentKeys = await getRegisteredKeys(storage);
    if (currentKeys.includes(storageKey)) {
      await saveRegisteredKeys(
        storage,
        currentKeys.filter((k) => k !== storageKey),
      );
    }
  } catch {
    // Ignored
  }
};

/**
 * Clears all stored `serverTime` checkpoints across all lists.
 */
export const clearAllStoredServerTimes = async (
  storage: KeyValueStorage = persistentStorageProxy,
): Promise<void> => {
  try {
    const keys = await getRegisteredKeys(storage);
    await Promise.all(keys.map((key) => Promise.resolve(storage.removeItem(key))));
    await storage.removeItem(INDEX_KEY);
  } catch {
    // Ignored
  }
};
