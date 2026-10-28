import { beforeEach, describe, expect, it } from 'vitest';
import {
  configureStorage,
  createMemoryStorage,
  getAccessToken,
  getRefreshToken,
  persistentStorageProxy,
  SESSION_STORAGE_KEY,
  sessionStorageProxy,
  useSessionStore,
} from '@/stores';
import type { AuthSession } from '@/types';

describe('useSessionStore storage and remember behavior', () => {
  const memoryPersistent = createMemoryStorage();
  const memorySession = createMemoryStorage();

  const mockSession: AuthSession = {
    user: {
      id: 'user-1',
      email: 'linh@cuteteachy.vn',
      emailVerified: true,
      loginProviders: ['password'],
      fullName: 'Nguyễn Thùy Linh',
      displayName: 'Linh',
      gender: 'female',
      onboardingCompletedAt: '2026-09-01T08:00:00.000Z',
    },
    accessToken: 'access-token-123',
    expiresAt: '2026-10-24T12:00:00.000Z',
    refreshToken: 'refresh-token-xyz',
    refreshExpiresAt: '2026-11-24T12:00:00.000Z',
  };

  beforeEach(() => {
    configureStorage(memoryPersistent, memorySession);
    memoryPersistent.removeItem(SESSION_STORAGE_KEY);
    memorySession.removeItem(SESSION_STORAGE_KEY);
    useSessionStore.getState().clearSession();
  });

  it('stores session and refreshToken in persistent storage when remember is true', () => {
    useSessionStore.getState().setSession(mockSession, true);

    expect(getAccessToken()).toBe('access-token-123');
    expect(getRefreshToken()).toBe('refresh-token-xyz');

    const persistentVal = persistentStorageProxy.getItem(SESSION_STORAGE_KEY) as string;
    expect(persistentVal).not.toBeNull();
    expect(persistentVal).toContain('refresh-token-xyz');

    const sessionVal = sessionStorageProxy.getItem(SESSION_STORAGE_KEY);
    expect(sessionVal).toBeNull();
  });

  it('stores session and refreshToken in session storage when remember is false', () => {
    useSessionStore.getState().setSession(mockSession, false);

    expect(getAccessToken()).toBe('access-token-123');
    expect(getRefreshToken()).toBe('refresh-token-xyz');

    const sessionVal = sessionStorageProxy.getItem(SESSION_STORAGE_KEY) as string;
    expect(sessionVal).not.toBeNull();
    expect(sessionVal).toContain('refresh-token-xyz');

    const persistentVal = persistentStorageProxy.getItem(SESSION_STORAGE_KEY);
    expect(persistentVal).toBeNull();
  });

  it('clears both persistent and session storages on clearSession()', () => {
    useSessionStore.getState().setSession(mockSession, true);
    expect(persistentStorageProxy.getItem(SESSION_STORAGE_KEY)).not.toBeNull();

    useSessionStore.getState().clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(persistentStorageProxy.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorageProxy.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
