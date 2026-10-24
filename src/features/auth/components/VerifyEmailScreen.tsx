'use client';

import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { Card, Icon } from '@/components/ui';
import { useAuthStatus } from '../hooks/use-auth-status';
import { FullPageLoader } from './FullPageLoader';
import { VerifyEmailForm } from './VerifyEmailForm';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  return <VerifyEmailForm initialEmail={emailParam} />;
}

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hydrated, isAuthenticated, isOnboarded } = useAuthStatus();

  // Đã xác minh & đã nạp session → nếu chưa onboarding về /onboarding, đã onboarding về /
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      if (!isOnboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    }
  }, [hydrated, isAuthenticated, isOnboarded, router]);

  if (!hydrated) return <FullPageLoader />;

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
            <h1 className="text-display-md text-on-surface">{t('auth.verify.title')}</h1>
            <p className="text-body-lg text-on-surface-variant">
              {t('auth.verify.subtitleDefault')}
            </p>
          </header>
          <Card variant="filled" padding="lg" className="bg-tertiary-container/40">
            <Suspense fallback={null}>
              <VerifyEmailContent />
            </Suspense>
          </Card>
        </div>
      </div>
    </main>
  );
}
