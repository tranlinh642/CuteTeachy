import { beforeEach, describe, expect, it } from 'vitest';
import { createServices } from '@/lib/api/services';
import { createHttpClient } from '@/lib/api/create-http-client';
import { useSessionStore, selectCurrentUser } from '@/stores';
import { validateAvatarFile } from '@/features/profile';
import { validateOnboardingValues } from './utils/onboarding-helpers';

describe('FE-05: Optional Avatar in Onboarding Flow', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it('completes onboarding successfully without choosing an avatar (skipping avatar)', async () => {
    let currentToken: string | null = null;
    const client = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => currentToken,
    });
    const services = createServices(client);

    const session = await services.auth.register({
      email: 'noavatar@school.edu.vn',
      password: 'password123',
    });
    currentToken = session.accessToken;
    useSessionStore.getState().setSession(session);

    // Initial state: no avatar, onboarding not completed
    const initialUser = selectCurrentUser(useSessionStore.getState());
    expect(initialUser?.avatarUrl).toBeUndefined();
    expect(initialUser?.onboardingCompletedAt).toBeNull();

    // Validate form values: no avatar field required
    const validation = validateOnboardingValues({
      fullName: 'Nguyễn Văn Nam',
      displayName: 'Nam',
      title: 'Giáo viên Toán',
      gender: 'male',
    });
    expect(validation.success).toBe(true);

    if (validation.success) {
      const updatedUser = await services.auth.updateProfile(validation.data);
      useSessionStore.getState().updateUser(updatedUser);
    }

    const completedUser = selectCurrentUser(useSessionStore.getState());
    expect(completedUser?.onboardingCompletedAt).toBeTruthy();
    expect(completedUser?.avatarUrl).toBeUndefined();
  });

  it('allows uploading optional avatar during onboarding and retains it on complete', async () => {
    let currentToken: string | null = null;
    const client = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => currentToken,
    });
    const services = createServices(client);

    const session = await services.auth.register({
      email: 'withavatar@school.edu.vn',
      password: 'password123',
    });
    currentToken = session.accessToken;
    useSessionStore.getState().setSession(session);

    // 1. Client-side rejects oversized file
    const oversized = new File(['x'.repeat(3 * 1024 * 1024)], 'photo.png', { type: 'image/png' });
    expect(validateAvatarFile(oversized).valid).toBe(false);

    // 2. Upload valid avatar
    const validFile = new File(['valid-image'], 'photo.png', { type: 'image/png' });
    expect(validateAvatarFile(validFile).valid).toBe(true);

    const uploaded = await services.auth.uploadAvatar(validFile);
    expect(uploaded.avatarUrl).toBeDefined();
    useSessionStore.getState().updateUser(uploaded);

    expect(selectCurrentUser(useSessionStore.getState())?.avatarUrl).toBe(uploaded.avatarUrl);

    // 3. Complete onboarding
    const validation = validateOnboardingValues({
      fullName: 'Trần Thị Hoa',
      displayName: 'Hoa',
      title: 'Cô giáo Mỹ thuật',
      gender: 'female',
    });
    expect(validation.success).toBe(true);

    if (validation.success) {
      const updatedUser = await services.auth.updateProfile(validation.data);
      useSessionStore.getState().updateUser(updatedUser);
    }

    const finalizedUser = selectCurrentUser(useSessionStore.getState());
    expect(finalizedUser?.onboardingCompletedAt).toBeTruthy();
    expect(finalizedUser?.avatarUrl).toBe(uploaded.avatarUrl);
  });

  it('displays pre-filled Google avatar and allows removing it during onboarding', async () => {
    let currentToken: string | null = null;
    const client = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => currentToken,
    });
    const services = createServices(client);

    // Google login exchange pre-fills Google avatar
    const googleSession = await services.auth.googleExchange('valid-code');
    currentToken = googleSession.accessToken;
    useSessionStore.getState().setSession(googleSession);

    const googleUser = selectCurrentUser(useSessionStore.getState());
    expect(googleUser?.avatarUrl).toBeDefined();
    expect(googleUser?.avatarUrl).toContain('googleusercontent.com');

    // Teacher decides to remove Google avatar
    const deletedUser = await services.auth.deleteAvatar();
    useSessionStore.getState().updateUser(deletedUser);
    expect(selectCurrentUser(useSessionStore.getState())?.avatarUrl).toBeUndefined();

    // Completes onboarding
    const validation = validateOnboardingValues({
      fullName: 'Lê Minh Tuấn',
      displayName: 'Tuấn',
      title: '',
      gender: 'male',
    });
    expect(validation.success).toBe(true);

    if (validation.success) {
      const updated = await services.auth.updateProfile(validation.data);
      useSessionStore.getState().updateUser(updated);
    }

    const finalUser = selectCurrentUser(useSessionStore.getState());
    expect(finalUser?.onboardingCompletedAt).toBeTruthy();
    expect(finalUser?.avatarUrl).toBeUndefined();
  });
});
