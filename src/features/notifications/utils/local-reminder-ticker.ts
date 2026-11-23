import type { ClassSession, Locale, Note, Task } from '@/types';
import { DEFAULT_NOTIFICATION_BADGE, DEFAULT_NOTIFICATION_ICON } from '@/lib/push';
import { formatClassSessionReminderNotification } from '@/utils';

export const LOCAL_REMINDER_STORAGE_KEY = 'cuteteachy:fired-reminder-tags';
export const REMINDER_WINDOW_MS = 10 * 60 * 1000;
export const TICKER_INTERVAL_MS = 15 * 1000;
export const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export type LocalReminderType = 'task' | 'class_session' | 'note';

export interface DueReminderItem {
  readonly tag: string;
  readonly type: LocalReminderType;
  readonly targetId: string;
  readonly remindAtMs: number;
  readonly title: string;
  readonly body: string;
  readonly url: string;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function resolveValidTimeZone(timeZone?: string): string {
  const candidate = timeZone?.trim() || DEFAULT_TIME_ZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function parseZonedTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date | null {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return null;
  if (!timeStr || !TIME_REGEX.test(timeStr)) return null;

  const validTz = resolveValidTimeZone(timeZone);
  const [year = 0, month = 1, day = 1] = dateStr.split('-').map(Number);
  const [hour = 0, minute = 0] = timeStr.split(':').map(Number);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: validTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  const getOffset = (utcMs: number): number => {
    const parts = formatter.formatToParts(new Date(utcMs));
    let y = 0;
    let m = 0;
    let d = 0;
    let h = 0;
    let min = 0;
    let s = 0;
    for (const part of parts) {
      if (part.type === 'year') y = Number(part.value);
      else if (part.type === 'month') m = Number(part.value);
      else if (part.type === 'day') d = Number(part.value);
      else if (part.type === 'hour') h = part.value === '24' ? 0 : Number(part.value);
      else if (part.type === 'minute') min = Number(part.value);
      else if (part.type === 'second') s = Number(part.value);
    }
    const localMs = Date.UTC(y, m - 1, d, h, min, s);
    return localMs - utcMs;
  };

  const offset = getOffset(guessUtc);
  const utcTime = guessUtc - offset;
  const offset2 = getOffset(utcTime);
  return new Date(guessUtc - offset2);
}

export function computeTaskRemindAt(
  task: Pick<Task, 'date' | 'time' | 'completed'>,
  leadMinutes: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date | null {
  if (task.completed || !task.date || !task.time || !task.time.trim()) {
    return null;
  }
  const startUtc = parseZonedTimeToUtc(task.date.slice(0, 10), task.time.trim(), timeZone);
  if (!startUtc) return null;
  return new Date(startUtc.getTime() - leadMinutes * 60_000);
}

export function computeClassSessionRemindAt(
  session: Pick<ClassSession, 'date' | 'startTime' | 'cancelled'>,
  leadMinutes: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date | null {
  if (session.cancelled || !session.date || !session.startTime || !session.startTime.trim()) {
    return null;
  }
  const startUtc = parseZonedTimeToUtc(
    session.date.slice(0, 10),
    session.startTime.trim(),
    timeZone,
  );
  if (!startUtc) return null;
  return new Date(startUtc.getTime() - leadMinutes * 60_000);
}

export function computeNoteRemindAt(
  note: Pick<Note, 'dueDate' | 'remindTime' | 'completed'>,
  leadMinutes: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date | null {
  if (note.completed || !note.dueDate || !note.dueDate.trim()) {
    return null;
  }
  const normalizedDate = note.dueDate.slice(0, 10);
  if (note.remindTime && note.remindTime.trim() !== '') {
    const startUtc = parseZonedTimeToUtc(normalizedDate, note.remindTime.trim(), timeZone);
    if (!startUtc) return null;
    return new Date(startUtc.getTime() - leadMinutes * 60_000);
  }
  return parseZonedTimeToUtc(normalizedDate, '07:00', timeZone);
}

export function buildReminderTag(
  type: LocalReminderType,
  targetId: string,
  remindAtMs: number,
): string {
  return `${type}-${targetId}-${remindAtMs}`;
}

/**
 * Plays a gentle in-app reminder chime using Web Audio API.
 * Safely wrapped in try/catch so missing APIs or autoplay restrictions never throw.
 */
export function playReminderChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    if (typeof gainNode.gain.exponentialRampToValueAtTime === 'function') {
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    }

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
    oscillator.onended = () => {
      void Promise.resolve(ctx.close?.()).catch(() => {});
    };
  } catch {
    // Ignore autoplay policy or unsupported audio context errors
  }
}

export type MinimalStorage = Pick<Storage, 'getItem' | 'setItem'>;

function getDefaultStorage(): MinimalStorage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function readFiredReminderTags(storage: MinimalStorage | null = getDefaultStorage()): Set<string> {
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(LOCAL_REMINDER_FIRED_TAGS_KEY_ALIAS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

const LOCAL_REMINDER_FIRED_TAGS_KEY_ALIAS = LOCAL_REMINDER_STORAGE_KEY;

export function writeFiredReminderTags(
  tags: Set<string>,
  storage: MinimalStorage | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    const entries = Array.from(tags).slice(-500);
    storage.setItem(LOCAL_REMINDER_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function formatDueTaskItem(
  task: Task,
  remindAtMs: number,
  locale: Locale,
): DueReminderItem {
  const isEn = locale === 'en';
  const prefix = isEn ? 'Task reminder' : 'Nhắc nhở công việc';
  return {
    tag: buildReminderTag('task', task.id, remindAtMs),
    type: 'task',
    targetId: task.id,
    remindAtMs,
    title: `${prefix}: ${task.title}`,
    body: task.time ?? '',
    url: `/calendar?date=${encodeURIComponent(task.date.slice(0, 10))}`,
  };
}

function formatDueClassSessionItem(
  session: ClassSession,
  remindAtMs: number,
  locale: Locale,
): DueReminderItem {
  const formatted = formatClassSessionReminderNotification(locale, session);

  return {
    tag: buildReminderTag('class_session', session.id, remindAtMs),
    type: 'class_session',
    targetId: session.id,
    remindAtMs,
    title: formatted.title,
    body: formatted.body,
    url: formatted.url,
  };
}

function formatDueNoteItem(
  note: Note,
  remindAtMs: number,
  locale: Locale,
): DueReminderItem {
  const isEn = locale === 'en';
  const prefix = isEn ? 'Note reminder' : 'Nhắc nhở ghi chú';
  const effectiveTime =
    note.remindTime && note.remindTime.trim() !== '' ? note.remindTime.trim() : '07:00';
  return {
    tag: buildReminderTag('note', note.id, remindAtMs),
    type: 'note',
    targetId: note.id,
    remindAtMs,
    title: `${prefix}: ${note.title}`,
    body: effectiveTime,
    url: `/notes?noteId=${encodeURIComponent(note.id)}`,
  };
}

export interface EvaluateDueRemindersInput {
  readonly tasks: readonly Task[];
  readonly classSessions: readonly ClassSession[];
  readonly notes: readonly Note[];
  readonly leadMinutes: number;
  readonly timeZone: string;
  readonly locale?: Locale;
  readonly now?: Date;
  readonly storage?: MinimalStorage | null;
}

export function evaluateDueReminders({
  tasks,
  classSessions,
  notes,
  leadMinutes,
  timeZone,
  locale = 'vi',
  now = new Date(),
  storage = getDefaultStorage(),
}: EvaluateDueRemindersInput): DueReminderItem[] {
  const nowMs = now.getTime();
  const windowStartMs = nowMs - REMINDER_WINDOW_MS;
  const firedTags = readFiredReminderTags(storage);
  const newlyDue: DueReminderItem[] = [];

  const isWithinWindow = (remindAt: Date | null): remindAt is Date => {
    if (!remindAt) return false;
    const ms = remindAt.getTime();
    return ms >= windowStartMs && ms <= nowMs;
  };

  for (const task of tasks) {
    const remindAt = computeTaskRemindAt(task, leadMinutes, timeZone);
    if (!isWithinWindow(remindAt)) continue;
    const remindAtMs = remindAt.getTime();
    const tag = buildReminderTag('task', task.id, remindAtMs);
    if (firedTags.has(tag)) continue;

    firedTags.add(tag);
    newlyDue.push(formatDueTaskItem(task, remindAtMs, locale));
  }

  for (const session of classSessions) {
    const remindAt = computeClassSessionRemindAt(session, leadMinutes, timeZone);
    if (!isWithinWindow(remindAt)) continue;
    const remindAtMs = remindAt.getTime();
    const tag = buildReminderTag('class_session', session.id, remindAtMs);
    if (firedTags.has(tag)) continue;

    firedTags.add(tag);
    newlyDue.push(formatDueClassSessionItem(session, remindAtMs, locale));
  }

  for (const note of notes) {
    const remindAt = computeNoteRemindAt(note, leadMinutes, timeZone);
    if (!isWithinWindow(remindAt)) continue;
    const remindAtMs = remindAt.getTime();
    const tag = buildReminderTag('note', note.id, remindAtMs);
    if (firedTags.has(tag)) continue;

    firedTags.add(tag);
    newlyDue.push(formatDueNoteItem(note, remindAtMs, locale));
  }

  if (newlyDue.length > 0) {
    writeFiredReminderTags(firedTags, storage);
  }

  return newlyDue;
}

export interface RunReminderTickInput extends EvaluateDueRemindersInput {
  readonly invalidateNotifications?: () => Promise<unknown> | void;
  readonly playChime?: () => void;
  readonly notificationPermission?: NotificationPermission;
  readonly visibilityState?: DocumentVisibilityState;
  readonly serviceWorkerReady?: Promise<Pick<ServiceWorkerRegistration, 'showNotification'>> | null;
}

export async function runReminderTick(input: RunReminderTickInput): Promise<DueReminderItem[]> {
  const newlyDue = evaluateDueReminders(input);
  if (newlyDue.length === 0) {
    return [];
  }

  try {
    (input.playChime ?? playReminderChime)();
  } catch {
    // Ignore audio errors
  }

  if (input.invalidateNotifications) {
    try {
      await input.invalidateNotifications();
    } catch {
      // Ignore query invalidation errors
    }
  }

  const permission =
    input.notificationPermission ??
    (typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default');
  const visibility =
    input.visibilityState ??
    (typeof document !== 'undefined' ? document.visibilityState : 'visible');

  if (permission === 'granted' && visibility === 'hidden') {
    const swReady =
      input.serviceWorkerReady !== undefined
        ? input.serviceWorkerReady
        : typeof navigator !== 'undefined' && 'serviceWorker' in navigator
          ? navigator.serviceWorker.ready
          : null;

    if (swReady) {
      try {
        const registration = await swReady;
        if (registration && typeof registration.showNotification === 'function') {
          await Promise.all(
            newlyDue.map((item) =>
              registration.showNotification(item.title, {
                body: item.body,
                icon: DEFAULT_NOTIFICATION_ICON,
                badge: DEFAULT_NOTIFICATION_BADGE,
                tag: item.tag,
                data: {
                  url: item.url,
                  type: item.type,
                  id: item.targetId,
                  targetId: item.targetId,
                  remindAt: new Date(item.remindAtMs).toISOString(),
                },
              }),
            ),
          );
        }
      } catch {
        // Ignore OS notification errors
      }
    }
  }

  return newlyDue;
}
