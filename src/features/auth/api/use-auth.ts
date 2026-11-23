'use client';

import { useI18nStore, useSessionStore } from '@/stores';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@/types';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';
import { clearPersistedQueryCache } from '@/lib/query';
import { clearAllStoredServerTimes } from '@/lib/sync';
import { unsubscribeDevice } from '@/features/push';

/**
 * Clears session, in-memory TanStack Query cache, persisted IndexedDB query cache,
 * and stored serverTime sync checkpoints (used on logout and 401 unauthorized).
 */
export async function clearAuthSessionState(queryClient?: QueryClient): Promise<void> {
  useSessionStore.getState().clearSession();
  queryClient?.clear();
  useI18nStore.getState().setLocale(DEFAULT_LOCALE);
  await Promise.all([
    clearAllStoredServerTimes(),
    clearPersistedQueryCache(),
  ]);
}

/**
 * Resets stored serverTime checkpoints and query caches before establishing a new session.
 */
export async function resetClientSyncAndCache(queryClient?: QueryClient): Promise<void> {
  queryClient?.clear();
  await Promise.all([
    clearAllStoredServerTimes(),
    clearPersistedQueryCache(),
  ]);
}

export function useRegister() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, RegisterCredentials>({
    mutationFn: async (credentials) => {
      const session = await auth.register(credentials);
      await resetClientSyncAndCache(queryClient);
      return session;
    },
    onSuccess: (session, variables) => {
      void clearAllStoredServerTimes();
      queryClient.clear();
      setSession(session, variables?.remember ?? true);
    },
  });
}

export function useLogin() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, LoginCredentials>({
    mutationFn: async (credentials) => {
      const session = await auth.login(credentials);
      await resetClientSyncAndCache(queryClient);
      return session;
    },
    onSuccess: (session, variables) => {
      void clearAllStoredServerTimes();
      queryClient.clear();
      setSession(session, variables?.remember ?? true);
    },
  });
}

export function useExchangeGoogleCode() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, { code: string; remember?: boolean } | string>({
    mutationFn: async (input) => {
      const code = typeof input === 'string' ? input : input.code;
      const session = await auth.googleExchange(code);
      await resetClientSyncAndCache(queryClient);
      return session;
    },
    onSuccess: (session, variables) => {
      const remember = typeof variables === 'object' && variables !== null ? (variables.remember ?? true) : true;
      void clearAllStoredServerTimes();
      queryClient.clear();
      setSession(session, remember);
    },
  });
}

export function useLogout() {
  const { auth, push } = useServices();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string | void>({
    mutationFn: async (refreshToken?: string | void) => {
      const token = typeof refreshToken === 'string' ? refreshToken : useSessionStore.getState().session?.refreshToken;

      // SPEC-005 / S5-FE-01: Delete active device PushSubscription if present before clearing session
      await unsubscribeDevice({
        deletePushSubscription: (payload) => push.deletePushSubscription(payload),
      });

      return auth.logout(token);
    },
    // Always clear locally, even if the server call fails.
    onSettled: async () => {
      await clearAuthSessionState(queryClient);
    },
  });
}

export function useVerifyEmail() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, VerifyEmailInput>({
    mutationFn: async (input) => {
      const session = await auth.verifyEmail(input);
      await resetClientSyncAndCache(queryClient);
      return session;
    },
    onSuccess: (session, variables) => {
      void clearAllStoredServerTimes();
      queryClient.clear();
      setSession(session, variables?.remember ?? true);
    },
  });
}

export function useResendVerificationCode() {
  const { auth } = useServices();

  return useMutation<void, ApiError, string>({
    mutationFn: (email) => auth.resendEmailCode(email),
  });
}

export function useForgotPassword() {
  const { auth } = useServices();

  return useMutation<void, ApiError, string>({
    mutationFn: (email) => auth.forgotPassword(email),
  });
}

export function useResetPassword() {
  const { auth } = useServices();

  return useMutation<void, ApiError, ResetPasswordInput>({
    mutationFn: (input) => auth.resetPassword(input),
  });
}
