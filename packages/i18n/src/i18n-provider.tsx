'use client';

import type { Locale } from '@cute-teachy/types';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_TAGS } from './constants';
import { createTranslator } from './translator';
import type { TranslateFn } from './translation.types';

export interface I18nContextValue {
  readonly locale: Locale;
  /** BCP-47 tag for `Intl` APIs, e.g. "vi-VN". */
  readonly localeTag: string;
  readonly t: TranslateFn;
  readonly setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  /** Controlled locale (e.g. from the persisted preferences store). */
  readonly locale?: Locale;
  /** Initial locale when uncontrolled. */
  readonly defaultLocale?: Locale;
  readonly onLocaleChange?: (locale: Locale) => void;
  readonly children: ReactNode;
}

/** Works in both React DOM (Next.js) and React Native. */
export function I18nProvider({
  locale: controlledLocale,
  defaultLocale = DEFAULT_LOCALE,
  onLocaleChange,
  children,
}: I18nProviderProps) {
  const [internalLocale, setInternalLocale] = useState<Locale>(defaultLocale);
  const locale = controlledLocale ?? internalLocale;

  const setLocale = useCallback(
    (next: Locale) => {
      if (controlledLocale === undefined) setInternalLocale(next);
      onLocaleChange?.(next);
    },
    [controlledLocale, onLocaleChange],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, localeTag: LOCALE_TAGS[locale], t: createTranslator(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
