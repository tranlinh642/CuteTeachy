'use client';

import { formatTimeRange, needsPreparation } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ClassSession } from '@/types';
import { Chip, Icon, toneClasses } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface ClassCardProps {
  readonly session: ClassSession;
  readonly className?: string;
}

export function ClassCard({ session, className }: ClassCardProps) {
  const { t, localeTag } = useTranslation();
  const title = session.grade ? `${session.subject} – ${session.grade}` : session.subject;
  const tone = toneClasses[session.tone];

  return (
    <article
      className={cn(
        'flex flex-col gap-2 rounded-xl p-4 transition-all shadow-xs',
        tone.bg,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-3 py-1 text-label-md font-bold text-on-surface">
          <Icon name="clock" size={14} className={tone.fg} />
          {formatTimeRange(session.startTime, session.endTime, localeTag)}
        </span>
        {needsPreparation(session) && (
          <Chip label={t('weekly.prepNeeded')} icon="checklist" />
        )}
      </div>

      <h3 className={cn('text-title-lg font-bold', tone.fg)}>{title}</h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <Icon name="school" size={16} />
          {session.room}
        </span>
        {session.topic && (
          <span>
            · {t('weekly.topic')}: <span className="font-medium text-on-surface">{session.topic}</span>
          </span>
        )}
      </div>

      {session.prepItems && session.prepItems.length > 0 && (
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
