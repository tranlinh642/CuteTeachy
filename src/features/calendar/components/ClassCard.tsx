'use client';

import { formatTimeRange, needsPreparation } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ClassSession } from '@/types';
import { Chip, Icon, toneClasses } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface ClassCardProps {
  readonly session: ClassSession;
  readonly className?: string;
  readonly onClick?: (session: ClassSession) => void;
}

export function ClassCard({ session, className, onClick }: ClassCardProps) {
  const { t, localeTag } = useTranslation();
  const title = session.grade ? `${session.subject} – ${session.grade}` : session.subject;
  const tone = toneClasses[session.tone];
  const isCancelled = session.cancelled;
  const isAdHoc = !session.timetableSlotId;
  const hasRoom = Boolean(session.room && session.room.trim().length > 0);

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(session) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick(session);
              }
            }
          : undefined
      }
      className={cn(
        'flex min-h-touch flex-col gap-2 rounded-xl p-4 transition-all shadow-xs',
        tone.bg,
        isCancelled && 'opacity-60 grayscale-[25%]',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-3 py-1 text-label-md font-bold text-on-surface">
          <Icon name="clock" size={14} className={tone.fg} />
          {formatTimeRange(session.startTime, session.endTime, localeTag)}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {isAdHoc && (
            <span className="rounded-full bg-surface-container-highest px-2.5 py-0.5 text-label-sm font-semibold text-on-surface-variant">
              {t('weekly.adHocBadge')}
            </span>
          )}

          {isCancelled && (
            <span
              className="rounded-full bg-error-container/90 px-2.5 py-0.5 text-label-sm font-bold text-on-error-container"
              aria-label={t('weekly.sessionCancelled')}
            >
              <span className="sr-only">{t('weekly.sessionCancelled')} - </span>
              {t('weekly.cancelled')}
            </span>
          )}

          {!isCancelled && needsPreparation(session) && (
            <Chip label={t('weekly.prepNeeded')} icon="checklist" />
          )}
        </div>
      </div>

      <h3
        className={cn(
          'text-title-lg font-bold',
          tone.fg,
          isCancelled && 'line-through text-on-surface-variant',
        )}
      >
        {title}
        {isCancelled && <span className="sr-only"> ({t('weekly.cancelled')})</span>}
      </h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
        {hasRoom && (
          <span className="inline-flex items-center gap-1">
            <Icon name="school" size={16} />
            {session.room}
          </span>
        )}
        {session.topic && (
          <span>
            {hasRoom ? '· ' : ''}
            {t('weekly.topic')}: <span className="font-medium text-on-surface">{session.topic}</span>
          </span>
        )}
      </div>

      {!isCancelled && session.prepItems && session.prepItems.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-current/10 pt-2 text-body-sm text-on-surface-variant">
          {session.prepItems.map((item) => (
            <li key={item.id} className="flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', tone.accent)} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
