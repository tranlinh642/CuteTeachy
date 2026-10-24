import { describe, expect, it } from 'vitest';
import { resolveAuthRedirect } from './auth-redirect';

describe('resolveAuthRedirect (3-state auth redirect decisions)', () => {
  describe('State 1: Unauthenticated (chưa đăng nhập)', () => {
    const authState = { isAuthenticated: false, isOnboarded: false };

    it('redirects to /login when accessing app routes', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/' })).toBe('/login');
      expect(resolveAuthRedirect({ ...authState, pathname: '/calendar' })).toBe('/login');
      expect(resolveAuthRedirect({ ...authState, pathname: '/notes' })).toBe('/login');
      expect(resolveAuthRedirect({ ...authState, pathname: '/profile' })).toBe('/login');
    });

    it('redirects to /login when accessing /onboarding', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/onboarding' })).toBe('/login');
    });

    it('allows access to public auth routes like /login and /register', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/login' })).toBeNull();
      expect(resolveAuthRedirect({ ...authState, pathname: '/register' })).toBeNull();
    });
  });

  describe('State 2: Onboarding Required (đã đăng nhập, chưa hoàn tất Onboarding)', () => {
    const authState = { isAuthenticated: true, isOnboarded: false };

    it('redirects to /onboarding when accessing app routes', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/' })).toBe('/onboarding');
      expect(resolveAuthRedirect({ ...authState, pathname: '/calendar' })).toBe('/onboarding');
      expect(resolveAuthRedirect({ ...authState, pathname: '/notes' })).toBe('/onboarding');
      expect(resolveAuthRedirect({ ...authState, pathname: '/profile' })).toBe('/onboarding');
    });

    it('allows access to /onboarding (no redirect)', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/onboarding' })).toBeNull();
    });

    it('redirects to /onboarding when visiting /login or /register', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/login' })).toBe('/onboarding');
      expect(resolveAuthRedirect({ ...authState, pathname: '/register' })).toBe('/onboarding');
    });
  });

  describe('State 3: Authenticated & Onboarded (đã đăng nhập và đã hoàn tất Onboarding)', () => {
    const authState = { isAuthenticated: true, isOnboarded: true };

    it('allows access to app routes (no redirect)', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/' })).toBeNull();
      expect(resolveAuthRedirect({ ...authState, pathname: '/calendar' })).toBeNull();
      expect(resolveAuthRedirect({ ...authState, pathname: '/notes' })).toBeNull();
      expect(resolveAuthRedirect({ ...authState, pathname: '/profile' })).toBeNull();
    });

    it('redirects to / when accessing /onboarding', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/onboarding' })).toBe('/');
    });

    it('redirects to / when accessing /login or /register', () => {
      expect(resolveAuthRedirect({ ...authState, pathname: '/login' })).toBe('/');
      expect(resolveAuthRedirect({ ...authState, pathname: '/register' })).toBe('/');
    });
  });
});
