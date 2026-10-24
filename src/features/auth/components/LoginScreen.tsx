'use client';

import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Card, Icon } from '@/components/ui';
import { useAuthStatus } from '../hooks/use-auth-status';
import { resolveOAuthErrorMessage } from '../hooks/use-auth-callback';
import { FullPageLoader } from './FullPageLoader';
import { LoginForm } from './LoginForm';

function OAuthErrorMessage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const message = resolveOAuthErrorMessage(errorParam, t);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="bg-error-container text-on-error-container text-body-sm mb-5 flex items-center gap-2 rounded-md px-4 py-3"
    >
      <Icon name="flag" size={18} />
      <span>{message}</span>
    </div>
  );
}

function ResetSuccessBanner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const resetParam = searchParams.get('reset');

  if (resetParam !== 'success') return null;

  return (
    <div
      role="status"
      className="bg-secondary-container text-on-secondary-container text-body-sm mb-5 flex items-center gap-2 rounded-md px-4 py-3"
    >
      <Icon name="check" size={18} />
      <span>{t('auth.login.resetSuccessBanner')}</span>
    </div>
  );
}

/** Trang đăng nhập: panel thương hiệu (desktop) + thẻ form. */
export function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuthStatus();

  // Đã đăng nhập (hoặc vừa đăng nhập xong) → về trang chủ.
  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace('/');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || isAuthenticated) return <FullPageLoader />;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section
        aria-hidden
        className="from-primary-container via-surface-container-low to-secondary-container hidden flex-col items-center justify-center gap-6 bg-linear-to-br p-12 text-center lg:flex"
      >
        <span className="bg-surface-container-lowest text-primary inline-flex size-32 items-center justify-center rounded-full shadow-md">
          <Icon name="spa" size={64} filled />
        </span>
        <p className="text-display-lg text-primary">{t('common.appName')}</p>
        <p className="text-title-md text-on-surface-variant max-w-sm">{t('common.tagline')}</p>
      </section>

      <div className="flex items-center justify-center px-container py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <header className="flex flex-col items-center gap-3 text-center">
            <span className="bg-surface-container text-primary inline-flex size-20 items-center justify-center rounded-full lg:hidden">
              <Icon name="spa" size={40} filled />
            </span>
            <h1 className="text-display-md text-on-surface">{t('auth.login.title')}</h1>
            <p className="text-body-lg text-on-surface-variant">{t('auth.login.subtitle')}</p>
          </header>
          <Card variant="filled" padding="lg" className="bg-tertiary-container/40">
            <Suspense fallback={null}>
              <ResetSuccessBanner />
              <OAuthErrorMessage />
            </Suspense>
            <LoginForm />
          </Card>
        </div>
      </div>
    </main>
  );
}
