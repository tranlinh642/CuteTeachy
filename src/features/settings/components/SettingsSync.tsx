'use client';

import { useEffect } from 'react';
import { useSettings } from '../api';
import { selectIsAuthenticated, useI18nStore, useSessionStore } from '@/stores';

/**
 * Syncs server-side settings into client-side state after login:
 * applies `locale` from server to i18n store.
 */
export function SettingsSync() {
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const { data: settings } = useSettings();
  const setLocale = useI18nStore((s) => s.setLocale);

  useEffect(() => {
    if (isAuthenticated && settings?.locale) {
      setLocale(settings.locale);
    }
  }, [isAuthenticated, settings?.locale, setLocale]);

  return null;
}
