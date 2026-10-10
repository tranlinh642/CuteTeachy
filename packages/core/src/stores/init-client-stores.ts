import { configureStorage, type KeyValueStorage } from '../storage/key-value-storage';
import { usePreferencesStore } from './preferences.store';
import { useSessionStore } from './session.store';

/**
 * Registers the platform storage and loads persisted client state.
 * Call once from the root layout of each app.
 */
export const initClientStores = async (storage: KeyValueStorage): Promise<void> => {
  configureStorage(storage);
  await Promise.all([usePreferencesStore.persist.rehydrate(), useSessionStore.persist.rehydrate()]);
};
