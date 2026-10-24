import { sessionStorageProxy } from '@/stores/key-value-storage';

export const OAUTH_REMEMBER_STORAGE_KEY = 'cute-teachy.auth.oauth-remember';

/**
 * Persists the user's "remember me" choice in sessionStorage before redirecting
 * to the OAuth provider, so `/auth/callback` can determine which storage to persist
 * the session into once the token exchange finishes.
 */
export function saveOAuthRemember(remember: boolean): void {
  sessionStorageProxy.setItem(OAUTH_REMEMBER_STORAGE_KEY, String(remember));
}

/**
 * Reads the stored "remember me" choice, defaulting to `true` if not found or unset.
 */
export function readOAuthRemember(): boolean {
  const value = sessionStorageProxy.getItem(OAUTH_REMEMBER_STORAGE_KEY);
  if (value === null) return true;
  return value === 'true';
}

/**
 * Clears the stored OAuth remember choice after consumption.
 */
export function clearOAuthRemember(): void {
  sessionStorageProxy.removeItem(OAUTH_REMEMBER_STORAGE_KEY);
}
