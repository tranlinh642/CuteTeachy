import { DEFAULT_LOCALE } from '@cute-teachy/i18n';
import type { Locale } from '@cute-teachy/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageProxy } from '../storage/key-value-storage';

interface PreferencesState {
  readonly locale: Locale;
  readonly pushNotifications: boolean;
  setLocale(locale: Locale): void;
  setPushNotifications(enabled: boolean): void;
}

/** Device-level preferences (language, notifications), persisted locally. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      pushNotifications: true,
      setLocale: (locale) => set({ locale }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
    }),
    {
      name: 'cute-teachy.preferences',
      storage: createJSONStorage(() => storageProxy),
      skipHydration: true,
    },
  ),
);
