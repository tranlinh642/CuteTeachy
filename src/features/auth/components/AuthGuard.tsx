'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStatus } from '../hooks/use-auth-status';
import { FullPageLoader } from './FullPageLoader';

export interface AuthGuardProps {
  readonly children: ReactNode;
}

/** Bảo vệ route phía client: đợi store nạp xong, chưa đăng nhập → /login, chưa onboarding → /onboarding. */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { hydrated, isAuthenticated, isOnboarded } = useAuthStatus();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (!isOnboarded) {
      router.replace('/onboarding');
    }
  }, [hydrated, isAuthenticated, isOnboarded, router]);

  if (!hydrated || !isAuthenticated || !isOnboarded) return <FullPageLoader />;
  return <>{children}</>;
}
