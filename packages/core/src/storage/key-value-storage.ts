/**
 * Minimal async key/value contract implemented per platform:
 *  - web:    window.localStorage
 *  - mobile: @react-native-async-storage/async-storage
 */
export interface KeyValueStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export const createMemoryStorage = (): KeyValueStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
};

let activeStorage: KeyValueStorage = createMemoryStorage();

/** Call once at app start-up, before `rehydrateStores()`. */
export const configureStorage = (storage: KeyValueStorage): void => {
  activeStorage = storage;
};

/**
 * Stable proxy handed to zustand `persist` at module load. It forwards to
 * whichever adapter the app registered, so stores can be defined in this
 * platform-agnostic package.
 */
export const storageProxy: KeyValueStorage = {
  getItem: (key) => activeStorage.getItem(key),
  setItem: (key, value) => activeStorage.setItem(key, value),
  removeItem: (key) => activeStorage.removeItem(key),
};
