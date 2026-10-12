'use client';

import { useTranslation } from '@/lib/i18n';
import Image from 'next/image';
import { useState } from 'react';
import { Button, Icon, IconButton } from '@/components/ui';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useSessionStore } from '@/stores';
import { cn } from '@/utils/cn';

export interface PwaInstallBannerProps {
  readonly className?: string;
}

export function PwaInstallBanner({ className }: PwaInstallBannerProps) {
  const { t } = useTranslation();
  const { isInstallable, isIos, promptInstall, dismiss } = usePwaInstall();
  const isAuthenticated = useSessionStore((state) => Boolean(state.session?.accessToken));
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!isAuthenticated || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide((prev) => !prev);
    } else {
      await promptInstall();
    }
  };

  return (
    <div
      role="region"
      aria-label={t('pwa.installTitle', { name: t('common.appName') })}
      className={cn(
        'fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40',
        'bg-surface-container-lowest/95 backdrop-blur-md border border-primary/20',
        'shadow-lg rounded-3xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-primary/10">
          <Image
            src="/icons/icon-192.png"
            alt={t('common.appName')}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-title-sm font-bold text-on-surface truncate">
              {t('pwa.installTitle', { name: t('common.appName') })}
            </h3>
            <IconButton
              icon="close"
              variant="ghost"
              size="sm"
              onClick={dismiss}
              aria-label={t('pwa.closeBanner')}
              className="-mr-1 text-on-surface-variant hover:text-on-surface"
            />
          </div>
          <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
            {t('pwa.installDescription')}
          </p>

          {showIosGuide && isIos && (
            <div className="mt-2 p-2.5 rounded-xl bg-primary-container/30 border border-primary-container/40 text-body-xs text-on-surface flex items-center gap-2">
              <Icon name="checklist" size={18} className="text-primary shrink-0" />
              <span>{t('pwa.iosGuide')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={handleInstallClick}
              className="flex-1 text-label-sm font-semibold rounded-full"
            >
              {isIos ? t('pwa.installGuideButton') : t('pwa.installButton')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="text-label-sm rounded-full text-on-surface-variant"
            >
              {t('pwa.dismissButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
