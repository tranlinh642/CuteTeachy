import { DEFAULT_LOCALE } from '@/lib/i18n/constants';
import type { Locale } from '@/types';
import { create } from 'zustand';

interface I18nStoreState {
  readonly locale: Locale;
  setLocale(locale: Locale): void;
}

/** Active client-side locale used by I18nProvider and HTTP Accept-Language headers. */
export const useI18nStore = create<I18nStoreState>()((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => set({ locale }),
}));
