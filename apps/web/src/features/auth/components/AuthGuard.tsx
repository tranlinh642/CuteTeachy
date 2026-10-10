'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStatus } from '../hooks/use-auth-status';
import { FullPageLoader } from './FullPageLoader';

export interface AuthGuardProps {
  readonly children: ReactNode;
}

/** Bảo vệ route phía client: đợi store nạp xong, chưa đăng nhập → /login. */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuthStatus();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/login');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return <FullPageLoader />;
  return children;
}
