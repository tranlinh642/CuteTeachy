'use client';

import { selectIsAuthenticated, useSessionStore } from '@/stores';

export interface AuthStatus {
  /** Store phiên đã nạp từ localStorage chưa. */
  readonly hydrated: boolean;
  readonly isAuthenticated: boolean;
}

export function useAuthStatus(): AuthStatus {
  const hydrated = useSessionStore((state) => state.hydrated);
  const isAuthenticated = useSessionStore(selectIsAuthenticated);
  return { hydrated, isAuthenticated };
}
