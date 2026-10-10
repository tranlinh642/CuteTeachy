import type { AuthSession, User } from '@cute-teachy/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageProxy } from '../storage/key-value-storage';

interface SessionState {
  readonly session: AuthSession | null;
  readonly hydrated: boolean;
  setSession(session: AuthSession): void;
  updateUser(user: User): void;
  clearSession(): void;
}

/**
 * Client-only auth state (token + current user). Server data lives in
 * TanStack Query (`@cute-teachy/api`), never here.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session }),
      updateUser: (user) => set((state) => (state.session ? { session: { ...state.session, user } } : state)),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'cute-teachy.session',
      storage: createJSONStorage(() => storageProxy),
      partialize: (state) => ({ session: state.session }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Non-React accessor used by the HTTP interceptor. */
export const getAccessToken = (): string | null => useSessionStore.getState().session?.accessToken ?? null;

export const selectIsAuthenticated = (state: SessionState): boolean => state.session !== null;
export const selectCurrentUser = (state: SessionState): User | null => state.session?.user ?? null;
