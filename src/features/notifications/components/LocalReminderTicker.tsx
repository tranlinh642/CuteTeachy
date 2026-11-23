'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import { selectIsAuthenticated, useSessionStore } from '@/stores';
import type { ClassSession, Note, Settings, Task } from '@/types';
import { Button, Icon, IconButton } from '@/components/ui';
import type { IconName } from '@/lib/theme';
import { useClasses } from '@/features/calendar';
import { useNotes } from '@/features/notes';
import { useSettings } from '@/features/settings';
import { useTasks } from '@/features/tasks';
import { getWeekDays, toISODate } from '@/utils';
import {
  DEFAULT_TIME_ZONE,
  TICKER_INTERVAL_MS,
  playReminderChime,
  runReminderTick,
  type DueReminderItem,
  type LocalReminderType,
} from '../utils/local-reminder-ticker';

export { playReminderChime };

export interface LocalReminderTickerProps {
  readonly isAuthenticatedOverride?: boolean;
  readonly tasksOverride?: readonly Task[];
  readonly classSessionsOverride?: readonly ClassSession[];
  readonly notesOverride?: readonly Note[];
  readonly settingsOverride?: Partial<Settings>;
  readonly initialToasts?: readonly DueReminderItem[];
}

function getReminderIcon(type: LocalReminderType): IconName {
  switch (type) {
    case 'class_session':
      return 'school';
    case 'task':
      return 'checklist';
    case 'note':
    default:
      return 'notes';
  }
}

function getNearTermRange() {
  // Dùng chung khoảng tuần hiện tại với WeeklyDashboard để chia sẻ cache React Query, tránh gọi trùng API.
  const weekDays = getWeekDays(new Date());
  return {
    from: toISODate(weekDays[0] ?? new Date()),
    to: toISODate(weekDays[weekDays.length - 1] ?? new Date()),
  };
}

function LocalReminderTickerConnected({
  isAuthenticatedOverride,
  tasksOverride,
  classSessionsOverride,
  notesOverride,
  settingsOverride,
  initialToasts = [],
}: LocalReminderTickerProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionAuth = useSessionStore(selectIsAuthenticated);
  const isAuthenticated = isAuthenticatedOverride ?? sessionAuth;

  const [activeToasts, setActiveToasts] = useState<readonly DueReminderItem[]>(initialToasts);

  const range = useMemo(() => getNearTermRange(), []);
  const { data: queriedTasks } = useTasks(range);
  const { data: queriedSessions } = useClasses(range);
  const { data: queriedNotesPages } = useNotes();
  const { data: queriedSettings } = useSettings();

  const tasks = useMemo(() => tasksOverride ?? queriedTasks ?? [], [tasksOverride, queriedTasks]);
  const classSessions = useMemo(
    () => classSessionsOverride ?? queriedSessions ?? [],
    [classSessionsOverride, queriedSessions],
  );
  const notes = useMemo(() => {
    if (notesOverride) return notesOverride;
    if (!queriedNotesPages?.pages) return [];
    const seen = new Set<string>();
    const merged: Note[] = [];
    for (const page of queriedNotesPages.pages) {
      for (const note of page.items ?? []) {
        if (!seen.has(note.id)) {
          seen.add(note.id);
          merged.push(note);
        }
      }
    }
    return merged;
  }, [notesOverride, queriedNotesPages]);

  const leadMinutes =
    settingsOverride?.reminderLeadMinutes ?? queriedSettings?.reminderLeadMinutes ?? 15;
  const timeZone =
    settingsOverride?.timeZone ?? queriedSettings?.timeZone ?? DEFAULT_TIME_ZONE;
  const effectiveLocale = settingsOverride?.locale ?? queriedSettings?.locale ?? locale;

  const checkDueReminders = useCallback(() => {
    if (!isAuthenticated) return;

    void runReminderTick({
      tasks,
      classSessions,
      notes,
      leadMinutes,
      timeZone,
      locale: effectiveLocale,
      playChime: playReminderChime,
      invalidateNotifications: () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    }).then((newlyDue) => {
      if (newlyDue.length > 0) {
        setActiveToasts((prev) => {
          const existingTags = new Set(prev.map((item) => item.tag));
          const uniqueNew = newlyDue.filter((item) => !existingTags.has(item.tag));
          return [...uniqueNew, ...prev];
        });
      }
    });
  }, [isAuthenticated, tasks, classSessions, notes, leadMinutes, timeZone, effectiveLocale, queryClient]);

  useEffect(() => {
    if (!isAuthenticated) return;

    checkDueReminders();

    const intervalId = setInterval(checkDueReminders, TICKER_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkDueReminders();
      }
    };

    const handleFocus = () => {
      checkDueReminders();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [isAuthenticated, checkDueReminders]);

  const dismissToast = (tag: string) => {
    setActiveToasts((prev) => prev.filter((item) => item.tag !== tag));
  };

  const handleNavigate = (item: DueReminderItem) => {
    dismissToast(item.tag);
    router.push(item.url);
  };

  if (!isAuthenticated || activeToasts.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-live="polite"
      data-testid="local-reminder-toast-container"
      aria-label={t('notifications.title')}
      className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2.5 pointer-events-none"
    >
      {activeToasts.map((item) => (
        <div
          key={item.tag}
          role="alert"
          data-testid={`reminder-toast-${item.tag}`}
          className="pointer-events-auto rounded-2xl bg-surface-container-lowest/95 backdrop-blur-md border border-primary/25 shadow-lg p-4 flex items-start gap-3 transition-all"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name={getReminderIcon(item.type)} size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-body-sm font-bold text-on-surface">{item.title}</p>
              <IconButton
                icon="close"
                size="sm"
                variant="ghost"
                aria-label={t('notifications.toastDismissAction')}
                onClick={() => dismissToast(item.tag)}
                className="-mr-1 -mt-1"
              />
            </div>
            <p className="text-body-xs text-on-surface-variant mt-0.5">{item.body}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleNavigate(item)}
              >
                {t('notifications.toastViewAction')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => dismissToast(item.tag)}
              >
                {t('notifications.toastDismissAction')}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LocalReminderTicker(props: LocalReminderTickerProps = {}) {
  const services = useContext(ServicesContext);
  if (!services) {
    return null;
  }
  return <LocalReminderTickerConnected {...props} />;
}
