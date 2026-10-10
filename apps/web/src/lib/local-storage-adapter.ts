import type { KeyValueStorage } from '@cute-teachy/core';

/** Adapter `window.localStorage` cho các store zustand của core (an toàn khi bị chặn storage). */
export const createLocalStorageAdapter = (): KeyValueStorage => ({
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Bỏ qua khi hết dung lượng / chế độ riêng tư.
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Bỏ qua.
    }
  },
});
