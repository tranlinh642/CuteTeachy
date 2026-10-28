import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSessionStore } from '@/stores';
import type { AuthSession, VerifyEmailInput } from '@/types';
import { CodeInput } from './components/CodeInput';
import { resolveAuthRedirect } from './utils/auth-redirect';

const mockSession: AuthSession = {
  user: {
    id: 'user-1',
    email: 'teacher@cuteteachy.vn',
    emailVerified: true,
    loginProviders: ['password'],
    fullName: 'Cô Mai',
    displayName: 'Mai',
    gender: 'female',
    onboardingCompletedAt: '2026-09-01T08:00:00.000Z',
  },
  accessToken: 'access-token-123',
  expiresAt: '2026-10-25T12:00:00.000Z',
  refreshToken: 'refresh-token-xyz',
  refreshExpiresAt: '2026-11-25T12:00:00.000Z',
};

describe('Code Review Fixes (fe-review-fixes)', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  describe('Fix 1: Session store remember flag propagation', () => {
    it('sets remember = false when explicit remember=false is provided', () => {
      useSessionStore.getState().setSession(mockSession, false);
      expect(useSessionStore.getState().remember).toBe(false);
      expect(useSessionStore.getState().session?.accessToken).toBe('access-token-123');
    });

    it('sets remember = true when explicit remember=true is provided', () => {
      useSessionStore.getState().setSession(mockSession, true);
      expect(useSessionStore.getState().remember).toBe(true);
      expect(useSessionStore.getState().session?.accessToken).toBe('access-token-123');
    });

    it('defaults remember to true when omitted', () => {
      useSessionStore.getState().setSession(mockSession);
      expect(useSessionStore.getState().remember).toBe(true);
    });

    it('allows VerifyEmailInput with remember flag', () => {
      const inputWithRemember: VerifyEmailInput = {
        email: 'teacher@cuteteachy.vn',
        code: '123456',
        remember: false,
      };
      expect(inputWithRemember.remember).toBe(false);
    });
  });

  describe('Fix 5: Authenticated redirect directly avoids double-hop', () => {
    it('redirects to / when user is authenticated and onboarded', () => {
      expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: true, pathname: '/login' })).toBe('/');
      expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: true, pathname: '/register' })).toBe('/');
    });

    it('redirects to /onboarding when user is authenticated but not onboarded', () => {
      expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: false, pathname: '/login' })).toBe('/onboarding');
      expect(resolveAuthRedirect({ isAuthenticated: true, isOnboarded: false, pathname: '/register' })).toBe('/onboarding');
    });
  });

  describe('Fix 7: CodeInput 6-digit box accessibility', () => {
    it('renders the 6-digit display boxes container with aria-hidden="true"', () => {
      const html = renderToStaticMarkup(
        <CodeInput value="1234" onChange={() => undefined} label="Mã xác thực" />,
      );
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('inputMode="numeric"');
      expect(html).toContain('autoComplete="one-time-code"');
    });
  });
});
