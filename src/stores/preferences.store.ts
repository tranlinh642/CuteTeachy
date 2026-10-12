import { DEFAULT_LOCALE } from '@/lib/i18n';
import type { Locale } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageProxy } from './key-value-storage';
import type { ThemePreference } from '@/lib/theme';

interface PreferencesState {
  readonly locale: Locale;
  readonly pushNotifications: boolean;
  readonly themePreference: ThemePreference;
  readonly pwaInstallDismissed: boolean;
  setLocale(locale: Locale): void;
  setPushNotifications(enabled: boolean): void;
  setThemePreference(theme: ThemePreference): void;
  setPwaInstallDismissed(dismissed: boolean): void;
}

export const PREFERENCES_STORAGE_KEY = 'cute-teachy.preferences';

/** Device-level preferences (language, notifications, theme), persisted locally. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      pushNotifications: true,
      themePreference: 'auto',
      pwaInstallDismissed: false,
      setLocale: (locale) => set({ locale }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setPwaInstallDismissed: (pwaInstallDismissed) => set({ pwaInstallDismissed }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => storageProxy),
      skipHydration: true,
    },
  ),
);
