'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button, Icon } from '@/components/ui';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <span className="bg-primary-container text-primary inline-flex size-20 items-center justify-center rounded-3xl shadow-soft">
          <Icon name="spa" size={40} filled />
        </span>
        <h1 className="text-display-sm font-display text-on-surface">
          {t('common.notFound.title')}
        </h1>
        <p className="text-body-md text-on-surface-variant">
          {t('common.notFound.description')}
        </p>
        <Link href="/" className="mt-2 inline-block">
          <Button variant="primary" size="lg" icon="home">
            {t('common.notFound.backHome')}
          </Button>
        </Link>
      </div>
    </main>
  );
}
