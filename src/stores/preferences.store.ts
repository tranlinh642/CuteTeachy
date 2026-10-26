import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageProxy } from './key-value-storage';
import type { ThemePreference } from '@/lib/theme';

interface PreferencesState {
  readonly themePreference: ThemePreference;
  readonly pwaInstallDismissed: boolean;
  setThemePreference(theme: ThemePreference): void;
  setPwaInstallDismissed(dismissed: boolean): void;
}

export const PREFERENCES_STORAGE_KEY = 'cute-teachy.preferences';

/** Device-level preferences (theme, PWA banner flag), persisted locally per SPEC-003. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themePreference: 'auto',
      pwaInstallDismissed: false,
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
