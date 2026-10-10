import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStorage } from '@cute-teachy/core';

/** Adapter AsyncStorage cho zustand persist (session, preferences) trong `@cute-teachy/core`. */
export const asyncStorageAdapter: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
