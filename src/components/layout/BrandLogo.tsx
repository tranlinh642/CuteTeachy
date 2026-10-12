'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { Icon } from '@/components/ui';

/** Logo + tên ứng dụng ở đầu sidebar. */
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <Link href="/" className="flex flex-col items-center gap-2 rounded-lg px-2 py-1 text-center">
      <span className="bg-primary-container text-primary border-surface-container-highest inline-flex size-16 items-center justify-center rounded-full border-4">
        <Icon name="spa" size={32} filled />
      </span>
      <span className="text-headline-md text-primary font-bold tracking-tight">{t('common.appName')}</span>
      <span className="text-body-sm text-on-surface-variant">{t('common.tagline')}</span>
    </Link>
  );
}
