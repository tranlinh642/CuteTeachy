import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiProvider } from '@cute-teachy/api';
import { usePreferencesStore } from '@cute-teachy/core';
import { I18nProvider } from '@cute-teachy/i18n';
import { apiConfig } from '@/lib/api-config';

export interface AppProvidersProps {
  readonly children: ReactNode;
}

/** Gói các provider gốc: safe area → i18n (theo preferences) → API (TanStack Query). */
export function AppProviders({ children }: AppProvidersProps) {
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);

  return (
    <SafeAreaProvider>
      <I18nProvider locale={locale} onLocaleChange={setLocale}>
        <ApiProvider config={apiConfig}>{children}</ApiProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
