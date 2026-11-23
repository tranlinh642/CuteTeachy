/**
 * @file format-notification.ts
 * Pure function to format Web Push notification options and payload.
 *
 * SPEC-005 & SPEC-006 (Push & Reminder):
 * Handles reminder payloads for Task, Class Session, and Note, guarantees safe
 * fallbacks on missing/malformed payloads, sets distinct notification tags
 * per item, and resolves target URLs to the correct date or note.
 */

export type PushReminderType = 'task' | 'class_session' | 'note' | (string & {});

export interface PushReminderPayload {
  type?: PushReminderType;
  id?: string | number;
  targetId?: string | number;
  sessionId?: string | number;
  taskId?: string | number;
  noteId?: string | number;
  remindAt?: string | number | Date;
  title?: string;
  body?: string;
  url?: string;
  targetDate?: string;
  date?: string;
  locale?: 'vi' | 'en' | string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FormattedNotificationData {
  url: string;
  id?: string;
  type?: string;
  targetDate?: string;
  [key: string]: unknown;
}

export interface FormattedNotification {
  title: string;
  body: string;
  icon: string;
  badge?: string;
  url: string;
  tag: string;
  data: FormattedNotificationData;
}

export const DEFAULT_NOTIFICATION_ICON = '/icons/icon-192.png';
export const DEFAULT_NOTIFICATION_BADGE = '/icons/icon-192.png';

const FALLBACK_TITLES = {
  vi: {
    task: 'Nhắc nhở công việc',
    class_session: 'Nhắc nhở tiết dạy',
    note: 'Nhắc nhở ghi chú',
    default: 'CuteTeachy',
  },
  en: {
    task: 'Task Reminder',
    class_session: 'Class Session Reminder',
    note: 'Note Reminder',
    default: 'CuteTeachy',
  },
} as const;

const FALLBACK_BODIES = {
  vi: {
    task: 'Bạn có một việc cần làm sắp đến giờ.',
    class_session: 'Bạn có một tiết dạy sắp bắt đầu.',
    note: 'Bạn có một ghi chú đến hạn.',
    default: 'Bạn có thông báo mới từ CuteTeachy.',
  },
  en: {
    task: 'You have an upcoming task.',
    class_session: 'You have an upcoming class session.',
    note: 'You have a note due.',
    default: 'You have a new reminder from CuteTeachy.',
  },
} as const;

function parseRemindAtToMs(remindAt: unknown): number | null {
  if (remindAt === undefined || remindAt === null || remindAt === '') {
    return null;
  }
  if (typeof remindAt === 'number' && Number.isFinite(remindAt)) {
    return remindAt;
  }
  if (remindAt instanceof Date) {
    const ms = remindAt.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof remindAt === 'string') {
    const trimmed = remindAt.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    }
    const parsedMs = new Date(trimmed).getTime();
    return Number.isFinite(parsedMs) ? parsedMs : null;
  }
  return null;
}

/**
 * Computes a unique notification tag to prevent duplicate/overlapping notifications.
 * Formats tag by explicitTag, or `${type}-${targetId}-${remindAtMs}` (synced with LocalReminderTicker),
 * or falls back to `reminder-${type}-${id}` for legacy payloads without remindAt.
 */
export function computeReminderTag(
  type?: string,
  id?: string | number,
  explicitTag?: string,
  remindAt?: unknown,
): string {
  if (explicitTag && typeof explicitTag === 'string' && explicitTag.trim()) {
    return explicitTag.trim();
  }

  const normalizedId = id !== undefined && id !== null ? String(id).trim() : '';
  const normalizedType = typeof type === 'string' ? type.trim() : '';
  const remindAtMs = parseRemindAtToMs(remindAt);

  if (normalizedType && normalizedId && remindAtMs !== null) {
    return `${normalizedType}-${normalizedId}-${remindAtMs}`;
  }

  if (normalizedId) {
    if (normalizedType === 'task') {
      return `reminder-task-${normalizedId}`;
    }
    if (normalizedType === 'class_session') {
      return `reminder-class-session-${normalizedId}`;
    }
    if (normalizedType === 'note') {
      return `reminder-note-${normalizedId}`;
    }
    if (normalizedType) {
      const sanitizedType = normalizedType.replace(/_/g, '-');
      return `reminder-${sanitizedType}-${normalizedId}`;
    }
    return `reminder-${normalizedId}`;
  }

  return 'reminder-general';
}

/**
 * Computes target URL opening the application to the correct date or note.
 */
export function computeReminderUrl(
  explicitUrl?: string,
  type?: string,
  targetDate?: string,
  id?: string | number,
): string {
  if (explicitUrl && typeof explicitUrl === 'string' && explicitUrl.trim()) {
    return explicitUrl.trim();
  }

  const normalizedType = typeof type === 'string' ? type.trim() : '';
  const normalizedDate =
    typeof targetDate === 'string' && targetDate.trim() ? targetDate.trim() : '';
  const normalizedId = id !== undefined && id !== null ? String(id).trim() : '';

  if (normalizedType === 'note') {
    if (normalizedId) {
      return `/notes?noteId=${encodeURIComponent(normalizedId)}`;
    }
    return '/notes';
  }

  if (normalizedDate) {
    const encodedDate = encodeURIComponent(normalizedDate);
    if (normalizedType === 'task') {
      return `/calendar?date=${encodedDate}`;
    }
    if (normalizedType === 'class_session') {
      return `/timetable?date=${encodedDate}`;
    }
    return `/?date=${encodedDate}`;
  }

  if (normalizedType === 'task') {
    return '/calendar';
  }
  if (normalizedType === 'class_session') {
    return '/timetable';
  }

  return '/';
}

export function computeReminderTitle(
  explicitTitle?: string,
  type?: string,
  locale?: string,
): string {
  if (explicitTitle && typeof explicitTitle === 'string' && explicitTitle.trim()) {
    return explicitTitle.trim();
  }

  const lang = locale === 'en' ? 'en' : 'vi';
  const titles = FALLBACK_TITLES[lang];

  if (type === 'task') {
    return titles.task;
  }
  if (type === 'class_session') {
    return titles.class_session;
  }
  if (type === 'note') {
    return titles.note;
  }
  return titles.default;
}

export function computeReminderBody(
  explicitBody?: string,
  type?: string,
  locale?: string,
): string {
  if (explicitBody && typeof explicitBody === 'string' && explicitBody.trim()) {
    return explicitBody.trim();
  }

  const lang = locale === 'en' ? 'en' : 'vi';
  const bodies = FALLBACK_BODIES[lang];

  if (type === 'task') {
    return bodies.task;
  }
  if (type === 'class_session') {
    return bodies.class_session;
  }
  if (type === 'note') {
    return bodies.note;
  }
  return bodies.default;
}

/**
 * Pure function parsing and formatting Web Push notification payload.
 *
 * Never throws unhandled errors; provides safe defaults on empty or malformed inputs.
 */
export function formatPushNotification(rawPayload?: unknown): FormattedNotification {
  let payload: Record<string, unknown> = {};

  if (typeof rawPayload === 'string') {
    try {
      const parsed = JSON.parse(rawPayload);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      // JSON syntax error or non-JSON string: safe fallback
      payload = {};
    }
  } else if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
    payload = rawPayload as Record<string, unknown>;
  }

  const nestedData =
    payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : {};

  const rawType =
    typeof payload.type === 'string' && payload.type.trim()
      ? payload.type.trim()
      : typeof nestedData.type === 'string' && nestedData.type.trim()
        ? nestedData.type.trim()
        : undefined;

  const rawIdCandidate =
    payload.id ??
    payload.targetId ??
    payload.sessionId ??
    payload.taskId ??
    payload.noteId ??
    nestedData.id ??
    nestedData.targetId ??
    nestedData.sessionId ??
    nestedData.taskId ??
    nestedData.noteId;

  const rawId =
    rawIdCandidate !== undefined &&
    rawIdCandidate !== null &&
    String(rawIdCandidate).trim() !== ''
      ? String(rawIdCandidate).trim()
      : undefined;

  const rawRemindAt =
    payload.remindAt ??
    nestedData.remindAt ??
    payload.remindAtMs ??
    nestedData.remindAtMs;

  const rawDate =
    typeof payload.targetDate === 'string' && payload.targetDate.trim()
      ? payload.targetDate.trim()
      : typeof payload.date === 'string' && payload.date.trim()
        ? payload.date.trim()
        : typeof nestedData.targetDate === 'string' && nestedData.targetDate.trim()
          ? nestedData.targetDate.trim()
          : typeof nestedData.date === 'string' && nestedData.date.trim()
            ? nestedData.date.trim()
            : undefined;

  const rawUrl =
    typeof payload.url === 'string' && payload.url.trim()
      ? payload.url.trim()
      : typeof nestedData.url === 'string' && nestedData.url.trim()
        ? nestedData.url.trim()
        : undefined;
  const rawTitle =
    typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : undefined;
  const rawBody =
    typeof payload.body === 'string' && payload.body.trim() ? payload.body.trim() : undefined;
  const rawLocale =
    typeof payload.locale === 'string' && payload.locale.trim() ? payload.locale.trim() : undefined;
  const rawTag =
    typeof payload.tag === 'string' && payload.tag.trim()
      ? payload.tag.trim()
      : typeof nestedData.tag === 'string' && nestedData.tag.trim()
        ? nestedData.tag.trim()
        : undefined;
  const rawIcon =
    typeof payload.icon === 'string' && payload.icon.trim() ? payload.icon.trim() : undefined;
  const rawBadge =
    typeof payload.badge === 'string' && payload.badge.trim() ? payload.badge.trim() : undefined;

  const title = computeReminderTitle(rawTitle, rawType, rawLocale);
  const body = computeReminderBody(rawBody, rawType, rawLocale);
  const url = computeReminderUrl(rawUrl, rawType, rawDate, rawId);
  const tag = computeReminderTag(rawType, rawId, rawTag, rawRemindAt);
  const icon = rawIcon || DEFAULT_NOTIFICATION_ICON;
  const badge = rawBadge || DEFAULT_NOTIFICATION_BADGE;

  const data: FormattedNotificationData = {
    ...payload,
    url,
    id: rawId,
    type: rawType,
    targetDate: rawDate,
  };

  return {
    title,
    body,
    icon,
    badge,
    url,
    tag,
    data,
  };
}

export const formatNotification = formatPushNotification;
