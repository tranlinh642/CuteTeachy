'use client';

import { useTodayInspiration } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import { Card, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface InspirationCardProps {
  readonly className?: string;
}

export function InspirationCard({ className }: InspirationCardProps) {
  const { t, locale } = useTranslation();
  const { data: quote, isLoading } = useTodayInspiration();

  if (isLoading || !quote) return null;

  return (
    <Card
      variant="tonal"
      padding="lg"
      className={cn('flex flex-col gap-3 relative overflow-hidden bg-surface-container-low border border-surface-variant', className)}
    >
      <div className="flex items-center gap-2">
        <Icon name="quote" size={20} className="text-secondary" />
        <span className="text-label-md font-bold uppercase tracking-wider text-secondary">
          {t('home.dailyInspiration')}
        </span>
      </div>
      <blockquote className="text-title-lg italic text-on-surface leading-relaxed">
        "{quote.quote[locale]}"
      </blockquote>
      {quote.author && (
        <p className="text-body-sm text-on-surface-variant font-medium self-end">
          — {quote.author}
        </p>
      )}
    </Card>
  );
}
