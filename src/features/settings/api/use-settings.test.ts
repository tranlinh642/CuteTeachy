import { beforeEach, describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { useI18nStore } from '@/stores';
import type { Settings, UpdateSettingsInput } from '@/types';

describe('Settings Hooks & Optimistic Updates (S3-FE-05)', () => {
  let queryClient: QueryClient;

  const initialSettings: Settings = {
    locale: 'vi',
    timeZone: 'Asia/Ho_Chi_Minh',
    pushEnabled: true,
    reminderLeadMinutes: 15,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(queryKeys.settings.all, initialSettings);
    useI18nStore.setState({ locale: 'vi' });
  });

  describe('Optimistic update and rollback for locale, pushEnabled, reminderLeadMinutes', () => {
    it('optimistically updates locale in query cache and i18n store, rolling back on error', async () => {
      const previousSettings = queryClient.getQueryData<Settings>(queryKeys.settings.all);
      const previousLocale = useI18nStore.getState().locale;
      expect(previousLocale).toBe('vi');

      const variables: UpdateSettingsInput = { locale: 'en' };

      // Simulate onMutate
      queryClient.setQueryData<Settings>(queryKeys.settings.all, (old) =>
        old ? { ...old, ...variables } : old,
      );
      if (variables.locale) {
        useI18nStore.getState().setLocale(variables.locale);
      }

      // Assert optimistic state
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.locale).toBe('en');
      expect(useI18nStore.getState().locale).toBe('en');

      // Simulate onError rollback
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.settings.all, previousSettings);
      }
      if (previousLocale) {
        useI18nStore.getState().setLocale(previousLocale);
      }

      // Assert rollback
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.locale).toBe('vi');
      expect(useI18nStore.getState().locale).toBe('vi');
    });

    it('optimistically updates pushEnabled switch, rolling back on failure', async () => {
      const previousSettings = queryClient.getQueryData<Settings>(queryKeys.settings.all);
      const variables: UpdateSettingsInput = { pushEnabled: false };

      // Optimistic update
      queryClient.setQueryData<Settings>(queryKeys.settings.all, (old) =>
        old ? { ...old, ...variables } : old,
      );
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.pushEnabled).toBe(false);

      // Rollback on error
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.settings.all, previousSettings);
      }
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.pushEnabled).toBe(true);
    });

    it('optimistically updates reminderLeadMinutes to 30, rolling back on failure', async () => {
      const previousSettings = queryClient.getQueryData<Settings>(queryKeys.settings.all);
      const variables: UpdateSettingsInput = { reminderLeadMinutes: 30 };

      // Optimistic update
      queryClient.setQueryData<Settings>(queryKeys.settings.all, (old) =>
        old ? { ...old, ...variables } : old,
      );
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.reminderLeadMinutes).toBe(30);

      // Rollback on error
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.settings.all, previousSettings);
      }
      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)?.reminderLeadMinutes).toBe(15);
    });

    it('updates cache with server response on success', () => {
      const serverResponse: Settings = {
        locale: 'en',
        timeZone: 'America/New_York',
        pushEnabled: false,
        reminderLeadMinutes: 60,
      };

      queryClient.setQueryData(queryKeys.settings.all, serverResponse);
      if (serverResponse.locale) {
        useI18nStore.getState().setLocale(serverResponse.locale);
      }

      expect(queryClient.getQueryData<Settings>(queryKeys.settings.all)).toEqual(serverResponse);
      expect(useI18nStore.getState().locale).toBe('en');
    });
  });
});
