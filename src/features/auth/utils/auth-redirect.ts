export interface AuthRedirectParams {
  /** True when a valid auth session exists. */
  readonly isAuthenticated: boolean;
  /** True when user has non-null onboardingCompletedAt. */
  readonly isOnboarded: boolean;
  /** The current pathname, e.g. '/', '/calendar', '/onboarding', '/login'. */
  readonly pathname: string;
}

/**
 * Pure decision function for auth redirection across 3 states:
 * 1. Unauthenticated -> app & onboarding redirect to /login; auth routes stay.
 * 2. Onboarding required -> app & login redirect to /onboarding; /onboarding stays.
 * 3. Authenticated & onboarded -> app routes stay; /login & /onboarding redirect to /.
 *
 * Returns null if the user is allowed to stay on the current pathname.
 */
export function resolveAuthRedirect({
  isAuthenticated,
  isOnboarded,
  pathname,
}: AuthRedirectParams): string | null {
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isOnboardingRoute = pathname === '/onboarding';

  if (!isAuthenticated) {
    if (isAuthRoute) return null;
    return '/login';
  }

  if (!isOnboarded) {
    if (isOnboardingRoute) return null;
    return '/onboarding';
  }

  if (isAuthRoute || isOnboardingRoute) {
    return '/';
  }

  return null;
}
