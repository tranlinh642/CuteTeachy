'use client';

import { selectIsAuthenticated, useSessionStore } from '@/stores';

export interface AuthStatus {
  /** Store phiên đã nạp từ localStorage chưa. */
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
  /** True nếu người dùng đã hoàn tất Onboarding (onboardingCompletedAt khác null). */
  readonly isOnboarded: boolean;
}

export function useAuthStatus(): AuthStatus {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  const isOnboarded = useSessionStore(
    (state) => Boolean(state.session?.user?.onboardingCompletedAt),
  );
  return { hydrated, isAuthenticated, isOnboarded };
}
