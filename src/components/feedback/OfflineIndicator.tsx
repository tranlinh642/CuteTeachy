'use client';

import { useTranslation } from '@/lib/i18n';
import { Icon } from '@/components/ui';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/utils/cn';

export interface OfflineIndicatorProps {
  readonly className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full bg-secondary-container/90 text-on-secondary-container px-4 py-2 text-body-xs font-medium',
        'flex items-center justify-center gap-2 border-b border-secondary-container transition-all animate-in fade-in slide-in-from-top-2',
        className,
      )}
    >
      <Icon name="bell" size={16} className="text-secondary shrink-0" />
      <span>{t('pwa.offlineNotice')}</span>
    </div>
  );
}
