import type { AuthSession, User } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorageProxy, sessionStorageProxy } from './key-value-storage';

export interface SessionState {
  readonly session: AuthSession | null;
  readonly remember: boolean;
  readonly hydrated: boolean;
  setSession(session: AuthSession, remember?: boolean): void;
  updateUser(user: User): void;
  clearSession(): void;
}

export const SESSION_STORAGE_KEY = 'cute-teachy.session';

export const dualStorageAdapter = {
  getItem: (name: string): string | null | Promise<string | null> => {
    const persistent = persistentStorageProxy.getItem(name);
    if (persistent) return persistent;
    return sessionStorageProxy.getItem(name);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    try {
      const parsed = JSON.parse(value) as { state?: { session?: AuthSession | null; remember?: boolean } };
      if (!parsed.state?.session) {
        persistentStorageProxy.removeItem(name);
        sessionStorageProxy.removeItem(name);
        return;
      }
      const remember = parsed.state?.remember ?? true;
      if (remember) {
        persistentStorageProxy.setItem(name, value);
        sessionStorageProxy.removeItem(name);
      } else {
        sessionStorageProxy.setItem(name, value);
        persistentStorageProxy.removeItem(name);
      }
    } catch {
      persistentStorageProxy.setItem(name, value);
    }
  },
  removeItem: (name: string): void | Promise<void> => {
    persistentStorageProxy.removeItem(name);
    sessionStorageProxy.removeItem(name);
  },
};

/**
 * Client-only auth state (token + current user). Server data lives in
 * TanStack Query, never here.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      remember: true,
      hydrated: false,
      setSession: (session, remember = true) => set({ session, remember }),
      updateUser: (user) => set((state) => (state.session ? { session: { ...state.session, user } } : state)),
      clearSession: () => {
        persistentStorageProxy.removeItem(SESSION_STORAGE_KEY);
        sessionStorageProxy.removeItem(SESSION_STORAGE_KEY);
        set({ session: null });
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => dualStorageAdapter),
      partialize: (state) => ({ session: state.session, remember: state.remember }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Non-React accessors used by HTTP interceptors. */
export const getAccessToken = (): string | null => useSessionStore.getState().session?.accessToken ?? null;
export const getRefreshToken = (): string | null => useSessionStore.getState().session?.refreshToken ?? null;

export const selectIsAuthenticated = (state: SessionState): boolean => state.session !== null;
export const selectCurrentUser = (state: SessionState): User | null => state.session?.user ?? null;
