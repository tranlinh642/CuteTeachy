'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useServices, ApiError, toApiError } from '@/lib/api';
import { useSessionStore } from '@/stores';
import type { AuthSession } from '@/types';
import type { TranslationKey } from '@/lib/i18n';
import { clearOAuthRemember, readOAuthRemember } from '../utils/oauth-storage';

export function resolveOAuthErrorMessage(
  error: string | null,
  t: (key: TranslationKey) => string,
): string | null {
  if (!error) return null;
  if (error === 'invalid_code') return t('auth.google.errors.invalidCode');
  if (error === 'network') return t('auth.google.errors.network');
  if (error === 'missing_code') return t('auth.google.errors.missingCode');
  return t('auth.google.errors.googleFailed');
}

export interface ProcessAuthCallbackParams {
  readonly code: string | null;
  readonly error: string | null;
  readonly exchange: (code: string) => Promise<AuthSession>;
  readonly setSession: (session: AuthSession, remember: boolean) => void;
  readonly readRemember: () => boolean;
  readonly clearRemember: () => void;
  readonly navigate: (path: string) => void;
}

/**
 * Pure handler for exchanging an OAuth code or navigating to login on error.
 */
export async function processAuthCallback({
  code,
  error,
  exchange,
  setSession,
  readRemember,
  clearRemember,
  navigate,
}: ProcessAuthCallbackParams): Promise<void> {
  // If provider returned an error on URL (e.g. ?error=google_failed)
  if (error) {
    navigate(`/login?error=${encodeURIComponent(error)}`);
    return;
  }

  // If no code was provided
  if (!code) {
    navigate('/login?error=missing_code');
    return;
  }

  try {
    const session = await exchange(code);
    const remember = readRemember();
    setSession(session, remember);
    clearRemember();

    const destination = !session.user.onboardingCompletedAt ? '/onboarding' : '/';
    navigate(destination);
  } catch (err) {
    const apiError = err instanceof ApiError ? err : toApiError(err);
    const errorCode = apiError.code || 'google_failed';
    navigate(`/login?error=${encodeURIComponent(errorCode)}`);
  }
}

/**
 * Hook to execute the OAuth callback exchange once and protect against duplicate
 * invocations caused by React 18/19 StrictMode double-mounting or component re-renders.
 */
export function useAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useServices();
  const setSession = useSessionStore((state) => state.setSession);
  const [isProcessing, setIsProcessing] = useState(true);

  // Single-flight guard against StrictMode double execution
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    void processAuthCallback({
      code,
      error,
      exchange: (authCode) => auth.googleExchange(authCode),
      setSession,
      readRemember: readOAuthRemember,
      clearRemember: clearOAuthRemember,
      navigate: (path) => {
        setIsProcessing(false);
        router.replace(path);
      },
    });
  }, [auth, router, searchParams, setSession]);

  return { isProcessing };
}
