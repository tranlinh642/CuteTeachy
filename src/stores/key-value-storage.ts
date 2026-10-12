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

let activeStorage: KeyValueStorage =
  typeof window !== 'undefined' ? createLocalStorageAdapter() : createMemoryStorage();

export const configureStorage = (storage: KeyValueStorage): void => {
  activeStorage = storage;
};

export const storageProxy: KeyValueStorage = {
  getItem: (key) => activeStorage.getItem(key),
  setItem: (key, value) => activeStorage.setItem(key, value),
  removeItem: (key) => activeStorage.removeItem(key),
};
