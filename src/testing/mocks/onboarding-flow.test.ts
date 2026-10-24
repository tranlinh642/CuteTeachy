import { describe, expect, it, vi } from 'vitest';
import { createServices } from '@/lib/api/services';
import { createHttpClient } from '@/lib/api/create-http-client';
import { ApiError } from '@/lib/api';
import { resolveActiveTheme, shouldResetThemeOnGenderChange } from '@/lib/theme';
import { resolveAuthRedirect } from '@/features/auth';
import { getInitialOnboardingValues, validateOnboardingValues } from '@/features/onboarding';

describe('FE-03: Full Onboarding Flow on Mock Backend', () => {
  it('runs complete flow for newly registered user: guard -> 403 -> form validation -> update profile -> theme switch -> unlocked app', async () => {
    let currentToken: string | null = null;
    const onOnboardingRequired = vi.fn();

    const client = createHttpClient({
      mode: 'mock',
      mockLatencyMs: 0,
      getAccessToken: () => currentToken,
      onOnboardingRequired,
    });
    const services = createServices(client);

    // 1. New user registers
    const session = await services.auth.register({
      email: 'thaygiaomoi@school.edu.vn',
      password: 'password123',
    });
    currentToken = session.accessToken;

    expect(session.user.email).toBe('thaygiaomoi@school.edu.vn');
    expect(session.user.onboardingCompletedAt).toBeNull();
    expect(session.user.gender).toBeNull();

    // 2. Auth redirect guard logic check for newly registered user
    const isOnboardedBefore = Boolean(session.user.onboardingCompletedAt);
    expect(isOnboardedBefore).toBe(false);

    // Any app route must redirect to /onboarding
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedBefore, pathname: '/' })).toBe('/onboarding');
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedBefore, pathname: '/calendar' })).toBe('/onboarding');
    // Onboarding page itself is accessible
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedBefore, pathname: '/onboarding' })).toBeNull();

    // 3. API calls to business routes return 403 onboarding_required and trigger global handler
    const taskErr = await services.tasks.list().catch((e: unknown) => e);
    expect(taskErr).toBeInstanceOf(ApiError);
    expect((taskErr as ApiError).code).toBe('onboarding_required');
    expect((taskErr as ApiError).status).toBe(403);
    expect(onOnboardingRequired).toHaveBeenCalledTimes(1);

    // /auth routes (like /auth/me) remain permitted
    const meBefore = await services.auth.me();
    expect(meBefore.id).toBe(session.user.id);
    expect(meBefore.onboardingCompletedAt).toBeNull();

    // 4. Form prefill verification: prefilled from User (displayName = 'thaygiaomoi'), gender must NOT be defaulted
    const initialForm = getInitialOnboardingValues(session.user);
    expect(initialForm.fullName).toBe('');
    expect(initialForm.displayName).toBe(session.user.displayName);
    expect(initialForm.gender).toBeNull();

    // 5. Form validation: submitting without gender must fail
    const invalidSubmission = validateOnboardingValues({
      fullName: 'Nguyễn Văn Minh',
      displayName: 'Minh',
      title: 'Thầy giáo Toán',
      gender: null,
    });
    expect(invalidSubmission.success).toBe(false);
    if (!invalidSubmission.success) {
      expect(invalidSubmission.errors.gender?.key).toBe('validation.required');
    }

    // 6. Complete onboarding by submitting valid profile with gender = 'male'
    const validSubmission = validateOnboardingValues({
      fullName: '  Thầy Nguyễn Văn Minh  ',
      displayName: '  Minh  ',
      title: '  Thầy giáo Toán  ',
      gender: 'male',
    });
    expect(validSubmission.success).toBe(true);
    if (!validSubmission.success) return;

    const updatedUser = await services.auth.updateProfile(validSubmission.data);
    expect(updatedUser.fullName).toBe('Thầy Nguyễn Văn Minh');
    expect(updatedUser.displayName).toBe('Minh');
    expect(updatedUser.gender).toBe('male');
    expect(updatedUser.onboardingCompletedAt).not.toBeNull();

    // 7. Verify Smart Default Theme according to ADR 0001
    // Gender transitioned from null to 'male' -> reset to 'auto'
    const shouldReset = shouldResetThemeOnGenderChange(updatedUser.gender, session.user.gender);
    expect(shouldReset).toBe(true);
    // Auto theme for male resolves to 'blue' (Masculine Palette)
    const activePalette = resolveActiveTheme(updatedUser.gender, 'auto');
    expect(activePalette).toBe('blue');

    // 8. Auth redirect guard logic check for completed user
    const isOnboardedAfter = Boolean(updatedUser.onboardingCompletedAt);
    expect(isOnboardedAfter).toBe(true);

    // Visiting /onboarding now redirects back to /
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedAfter, pathname: '/onboarding' })).toBe('/');
    // App routes are now allowed without redirect
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedAfter, pathname: '/' })).toBeNull();
    expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: isOnboardedAfter, pathname: '/calendar' })).toBeNull();

    // 9. Business routes are now unlocked and return normal data
    const tasks = await services.tasks.list();
    expect(Array.isArray(tasks)).toBe(true);
  });
});
