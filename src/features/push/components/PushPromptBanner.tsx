'use client';

import { useTranslation } from '@/lib/i18n';
import { Button, Icon, IconButton } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface PushPromptBannerProps {
  readonly onEnable: () => void;
  readonly onDismiss: () => void;
  readonly className?: string;
}

export function PushPromptBanner({
  onEnable,
  onDismiss,
  className,
}: PushPromptBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="region"
      aria-label={t('push.banner.title')}
      className={cn(
        'rounded-3xl bg-surface-container-lowest/95 backdrop-blur-md border border-primary/20',
        'shadow-md p-4 transition-all duration-300 animate-in fade-in',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary-container/50 flex items-center justify-center text-primary shrink-0">
          <Icon name="bell" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-title-sm font-bold text-on-surface truncate">
              {t('push.banner.title')}
            </h3>
            <IconButton
              icon="close"
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              aria-label={t('common.actions.close')}
              className="-mr-1 text-on-surface-variant hover:text-on-surface"
            />
          </div>
          <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
            {t('push.banner.description')}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              icon="bell"
              onClick={onEnable}
              className="text-label-sm font-semibold rounded-full"
            >
              {t('push.banner.enableButton')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-label-sm rounded-full text-on-surface-variant"
            >
              {t('push.banner.dismissButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
