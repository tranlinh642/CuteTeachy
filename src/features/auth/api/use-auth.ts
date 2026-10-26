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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { useServices } from '@/lib/api';

export function useRegister() {
  const { auth } = useServices();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, RegisterCredentials>({
    mutationFn: (credentials) => auth.register(credentials),
    onSuccess: (session, variables) => setSession(session, variables?.remember ?? true),
  });
}

export function useLogin() {
  const { auth } = useServices();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, LoginCredentials>({
    mutationFn: (credentials) => auth.login(credentials),
    onSuccess: (session, variables) => setSession(session, variables?.remember ?? true),
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
      useI18nStore.getState().setLocale(DEFAULT_LOCALE);
    },
  });
}

export function useVerifyEmail() {
  const { auth } = useServices();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation<AuthSession, ApiError, VerifyEmailInput>({
    mutationFn: (input) => auth.verifyEmail(input),
    onSuccess: (session, variables) => setSession(session, variables?.remember ?? true),
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
