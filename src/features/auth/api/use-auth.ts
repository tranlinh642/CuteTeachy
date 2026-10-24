'use client';

import { useSessionStore } from '@/stores';
import type { LoginCredentials } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';

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

  return useMutation<void, ApiError, string | void>({
    mutationFn: (refreshToken?: string | void) => {
      const token = typeof refreshToken === 'string' ? refreshToken : useSessionStore.getState().session?.refreshToken;
      return auth.logout(token);
    },
    // Always clear locally, even if the server call fails.
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
