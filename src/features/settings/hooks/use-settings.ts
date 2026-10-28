'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { selectIsAuthenticated, useI18nStore, useSessionStore } from '@/stores';
import type { Locale, Settings, UpdateSettingsInput } from '@/types';

export function useSettings() {
  const { settings } = useServices();
  const isAuthenticated = useSessionStore(selectIsAuthenticated);

  return useQuery<Settings, ApiError>({
    queryKey: queryKeys.settings.all,
    queryFn: () => settings.get(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}

interface SettingsMutationContext {
  previousSettings?: Settings;
  previousLocale?: Locale;
}

export function useUpdateSettings() {
  const { settings } = useServices();
  const queryClient = useQueryClient();

  return useMutation<Settings, ApiError, UpdateSettingsInput, SettingsMutationContext>({
    mutationFn: (input) => settings.update(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all });
      const previousSettings = queryClient.getQueryData<Settings>(queryKeys.settings.all);
      const previousLocale = useI18nStore.getState().locale;

      // Optimistically update query data
      queryClient.setQueryData<Settings>(queryKeys.settings.all, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });

      // Optimistically apply locale if modified
      if (variables.locale && variables.locale !== previousLocale) {
        useI18nStore.getState().setLocale(variables.locale);
      }

      return { previousSettings, previousLocale };
    },
    onError: (_error, _variables, context) => {
      // Rollback settings query cache
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.settings.all, context.previousSettings);
      }
      // Rollback i18n locale
      if (context?.previousLocale) {
        useI18nStore.getState().setLocale(context.previousLocale);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.all, data);
      if (data.locale) {
        useI18nStore.getState().setLocale(data.locale);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}
