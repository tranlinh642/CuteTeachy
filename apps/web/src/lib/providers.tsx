'use client';

import { ApiProvider } from '@cute-teachy/api';
import { initClientStores, usePreferencesStore } from '@cute-teachy/core';
import { I18nProvider } from '@cute-teachy/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { createApiConfig } from './api-config';
import { HtmlLangSync } from './html-lang-sync';
import { createLocalStorageAdapter } from './local-storage-adapter';

// Đảm bảo chỉ khởi tạo store một lần (StrictMode gọi effect hai lần ở dev).
let storesInit: Promise<void> | null = null;
const ensureClientStores = (): Promise<void> => {
  storesInit ??= initClientStores(createLocalStorageAdapter());
  return storesInit;
};

export interface ProvidersProps {
  readonly children: ReactNode;
}

/** Providers phía client: store persisted, i18n (theo preferences) và API/TanStack Query. */
export function Providers({ children }: ProvidersProps) {
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  const [apiConfig] = useState(createApiConfig);

  useEffect(() => {
    void ensureClientStores();
  }, []);

  return (
    <I18nProvider locale={locale} onLocaleChange={setLocale}>
      <ApiProvider config={apiConfig}>
        <HtmlLangSync />
        {children}
      </ApiProvider>
    </I18nProvider>
  );
}
