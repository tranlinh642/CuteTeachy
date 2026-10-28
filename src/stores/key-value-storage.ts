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

export const createLocalStorageAdapter = (): KeyValueStorage => ({
  getItem: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Bỏ qua khi hết dung lượng / chế độ riêng tư.
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Bỏ qua.
    }
  },
});

export const createSessionStorageAdapter = (): KeyValueStorage => ({
  getItem: (key) => {
    try {
      if (typeof window === 'undefined') return null;
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Bỏ qua khi hết dung lượng / chế độ riêng tư.
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Bỏ qua.
    }
  },
});

let activePersistentStorage: KeyValueStorage =
  typeof window !== 'undefined' ? createLocalStorageAdapter() : createMemoryStorage();

let activeSessionStorage: KeyValueStorage =
  typeof window !== 'undefined' ? createSessionStorageAdapter() : createMemoryStorage();

export const configureStorage = (
  storage: KeyValueStorage,
  sessionStorage?: KeyValueStorage,
): void => {
  activePersistentStorage = storage;
  if (sessionStorage) {
    activeSessionStorage = sessionStorage;
  }
};

export const persistentStorageProxy: KeyValueStorage = {
  getItem: (key) => activePersistentStorage.getItem(key),
  setItem: (key, value) => activePersistentStorage.setItem(key, value),
  removeItem: (key) => activePersistentStorage.removeItem(key),
};

export const sessionStorageProxy: KeyValueStorage = {
  getItem: (key) => activeSessionStorage.getItem(key),
  setItem: (key, value) => activeSessionStorage.setItem(key, value),
  removeItem: (key) => activeSessionStorage.removeItem(key),
};

export const storageProxy: KeyValueStorage = persistentStorageProxy;
