'use client';

import { Button, Icon, IconButton } from '@/components/ui';
import { usePwaUpdate } from '@/hooks/use-pwa-update';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/utils/cn';

export interface PwaUpdateBannerProps {
  readonly className?: string;
  /** Test/preview override to force displaying the banner */
  readonly forceVisible?: boolean;
}

export function PwaUpdateBanner({ className, forceVisible = false }: PwaUpdateBannerProps = {}) {
  const { t } = useTranslation();
  const { hasUpdate, isDismissed, isUpdating, applyUpdate, dismiss } = usePwaUpdate();

  if (!forceVisible && (!hasUpdate || isDismissed)) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-update-banner"
      className={cn(
        'fixed left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50',
        'top-[calc(env(safe-area-inset-top)+0.75rem)]',
        'rounded-3xl border border-primary/30 bg-surface-container-lowest/95 backdrop-blur-md p-4 shadow-xl',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
          <Icon name="spa" size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-title-sm font-bold text-on-surface">
              {t('pwa.updateTitle')}
            </h3>
            <IconButton
              icon="close"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={dismiss}
              aria-label={t('pwa.closeUpdateBanner')}
              className="-mr-1 text-on-surface-variant hover:text-on-surface"
            />
          </div>
          <p className="text-body-xs text-on-surface-variant mt-0.5">
            {t('pwa.updateDescription')}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon="check"
              data-testid="pwa-update-now-button"
              loading={isUpdating}
              onClick={() => void applyUpdate()}
              className="rounded-full"
            >
              {isUpdating ? t('pwa.updatingButton') : t('pwa.updateButton')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="pwa-update-dismiss-button"
              disabled={isUpdating}
              onClick={dismiss}
              className="rounded-full text-on-surface-variant"
            >
              {t('pwa.dismissButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
