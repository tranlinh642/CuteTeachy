'use client';

import { useSessionStore } from '@cute-teachy/core';
import type { LoginCredentials } from '@cute-teachy/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../http/api-error';
import { useServices } from '../provider/services-context';

export function useLogin() {
  const { auth } = useServices();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<Awaited<ReturnType<typeof auth.login>>, ApiError, LoginCredentials>({
    mutationFn: (credentials) => auth.login(credentials),
    onSuccess: (session) => setSession(session),
  });
}

export function useLogout() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation<void, ApiError, void>({
    mutationFn: () => auth.logout(),
    // Always clear locally, even if the server call fails.
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
