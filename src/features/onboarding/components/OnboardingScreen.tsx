'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Button, Card, ConfirmDialog, Icon } from '@/components/ui';
import { FullPageLoader, useAuthStatus, useLogout } from '@/features/auth';
import { OnboardingForm } from './OnboardingForm';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hydrated, isAuthenticated, isOnboarded } = useAuthStatus();
  const logout = useLogout();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (isOnboarded) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, isOnboarded, router]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        setConfirmLogoutOpen(false);
        router.replace('/login');
      },
    });
  };

  if (!hydrated || !isAuthenticated || isOnboarded) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="bg-primary-container text-primary inline-flex size-9 items-center justify-center rounded-full">
            <Icon name="spa" size={20} filled />
          </span>
          <span className="text-title-md text-primary font-bold">{t('common.appName')}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon="logout"
          onClick={() => setConfirmLogoutOpen(true)}
        >
          {t('onboarding.logout')}
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          <Card variant="filled" padding="lg" className="bg-surface-container-lowest/80 shadow-md">
            <div className="mb-6 flex flex-col gap-2 text-center">
              <span className="bg-primary/10 text-primary mx-auto inline-flex size-14 items-center justify-center rounded-full">
                <Icon name="school" size={28} filled />
              </span>
              <h1 className="text-display-sm text-on-surface font-bold">
                {t('onboarding.title')}
              </h1>
              <p className="text-body-md text-on-surface-variant">
                {t('onboarding.subtitle')}
              </p>
            </div>

            <OnboardingForm />
          </Card>
        </div>
      </main>

      <ConfirmDialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={handleLogout}
        title={t('onboarding.logout')}
        message={t('onboarding.logoutConfirm')}
        confirmLabel={t('onboarding.logout')}
        loading={logout.isPending}
        destructive
      />
    </div>
  );
}
