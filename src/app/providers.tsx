'use client';

import { ApiProvider } from '@/lib/api';
import { createIdbPersister } from '@/lib/query';
import {
  initClientStores,
  useI18nStore,
  useSessionStore,
  getAccessToken,
  createLocalStorageAdapter,
} from '@/stores';
import { I18nProvider } from '@/lib/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import type { ApiConfig } from '@/config';
import { env } from '@/config';
import { HtmlLangSync } from './html-lang-sync';
import { ThemeSync } from '@/lib/theme';
import { SettingsSync } from '@/features/settings';

const createApiConfig = (): ApiConfig => ({
  baseURL: env.apiUrl,
  mode: env.apiMode,
  getAccessToken,
  getLocale: () => useI18nStore.getState().locale,
  // 401 -> xóa phiên; AuthGuard sẽ tự chuyển về /login.
  onUnauthorized: () => useSessionStore.getState().clearSession(),
  // 403 onboarding_required -> chuyển về /onboarding.
  onOnboardingRequired: () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
      window.location.replace('/onboarding');
    }
  },
});

// Đảm bảo chỉ khởi tạo store một lần (StrictMode gọi effect hai lần ở dev).
let storesInit: Promise<void> | null = null;
const ensureClientStores = (): Promise<void> => {
  storesInit ??= initClientStores(createLocalStorageAdapter());
  return storesInit;
};

export interface ProvidersProps {
  readonly children: ReactNode;
}

/** Providers phía client: store persisted, i18n và API/TanStack Query. */
export function Providers({ children }: ProvidersProps) {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const [apiConfig] = useState(createApiConfig);
  const [persistOptions] = useState(() => {
    const persister = createIdbPersister();
    return persister ? { persister, maxAge: 1000 * 60 * 60 * 24 * 7 } : undefined;
  });

  useEffect(() => {
    void ensureClientStores();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSw = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSw();
      } else {
        window.addEventListener('load', registerSw);
      }
    }
  }, []);

  return (
    <I18nProvider locale={locale} onLocaleChange={setLocale}>
      <ApiProvider config={apiConfig} persistOptions={persistOptions}>
        <HtmlLangSync />
        <ThemeSync />
        <SettingsSync />
        {children}
      </ApiProvider>
    </I18nProvider>
  );
}
