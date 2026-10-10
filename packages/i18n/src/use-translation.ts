'use client';

import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './i18n-provider';

/**
 * Access translations anywhere below `<I18nProvider>`.
 *
 * @example
 * const { t } = useTranslation();
 * t('home.greeting.morning', { name: user.displayName });
 */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used inside <I18nProvider>.');
  }
  return context;
}
