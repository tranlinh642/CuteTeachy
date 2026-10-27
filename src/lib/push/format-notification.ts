/**
 * @file format-notification.ts
 * Pure function to format Web Push notification options and payload.
 *
 * SPEC-005 (Push & Reminder):
 * Handles reminder payloads for Task and Class Session, guarantees safe
 * fallbacks on missing/malformed payloads, sets distinct notification tags
 * per item, and resolves target URLs to the correct date.
 */

export type PushReminderType = 'task' | 'class_session' | (string & {});

export interface PushReminderPayload {
  type?: PushReminderType;
  id?: string | number;
  title?: string;
  body?: string;
  url?: string;
  targetDate?: string;
  date?: string;
  locale?: 'vi' | 'en' | string;
  icon?: string;
  badge?: string;
  tag?: string;
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
    default: 'CuteTeachy',
  },
  en: {
    task: 'Task Reminder',
    class_session: 'Class Session Reminder',
    default: 'CuteTeachy',
  },
} as const;

const FALLBACK_BODIES = {
  vi: {
    task: 'Bạn có một việc cần làm sắp đến giờ.',
    class_session: 'Bạn có một tiết dạy sắp bắt đầu.',
    default: 'Bạn có thông báo mới từ CuteTeachy.',
  },
  en: {
    task: 'You have an upcoming task.',
    class_session: 'You have an upcoming class session.',
    default: 'You have a new reminder from CuteTeachy.',
  },
} as const;

/**
 * Computes a unique notification tag to prevent duplicate/overlapping notifications.
 * Formats tag by item type and id (e.g. `reminder-task-${id}` or `reminder-class-session-${id}`).
 */
export function computeReminderTag(
  type?: string,
  id?: string | number,
  explicitTag?: string,
): string {
  const normalizedId = id !== undefined && id !== null ? String(id).trim() : '';
  const normalizedType = typeof type === 'string' ? type.trim() : '';

  if (normalizedId) {
    if (normalizedType === 'task') {
      return `reminder-task-${normalizedId}`;
    }
    if (normalizedType === 'class_session') {
      return `reminder-class-session-${normalizedId}`;
    }
    if (normalizedType) {
      const sanitizedType = normalizedType.replace(/_/g, '-');
      return `reminder-${sanitizedType}-${normalizedId}`;
    }
    return `reminder-${normalizedId}`;
  }

  if (explicitTag && typeof explicitTag === 'string' && explicitTag.trim()) {
    return explicitTag.trim();
  }

  return 'reminder-general';
}

/**
 * Computes target URL opening the application to the correct date.
 */
export function computeReminderUrl(
  explicitUrl?: string,
  type?: string,
  targetDate?: string,
): string {
  if (explicitUrl && typeof explicitUrl === 'string' && explicitUrl.trim()) {
    return explicitUrl.trim();
  }

  const normalizedType = typeof type === 'string' ? type.trim() : '';
  const normalizedDate =
    typeof targetDate === 'string' && targetDate.trim() ? targetDate.trim() : '';

  if (normalizedDate) {
    const encodedDate = encodeURIComponent(normalizedDate);
    if (normalizedType === 'task') {
      return `/tasks?date=${encodedDate}`;
    }
    if (normalizedType === 'class_session') {
      return `/timetable?date=${encodedDate}`;
    }
    return `/?date=${encodedDate}`;
  }

  if (normalizedType === 'task') {
    return '/tasks';
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

  const rawType = typeof payload.type === 'string' ? payload.type.trim() : undefined;
  const rawId =
    payload.id !== undefined && payload.id !== null ? String(payload.id).trim() : undefined;
  const rawDate =
    typeof payload.targetDate === 'string' && payload.targetDate.trim()
      ? payload.targetDate.trim()
      : typeof payload.date === 'string' && payload.date.trim()
        ? payload.date.trim()
        : undefined;

  const rawUrl =
    typeof payload.url === 'string' && payload.url.trim() ? payload.url.trim() : undefined;
  const rawTitle =
    typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : undefined;
  const rawBody =
    typeof payload.body === 'string' && payload.body.trim() ? payload.body.trim() : undefined;
  const rawLocale =
    typeof payload.locale === 'string' && payload.locale.trim() ? payload.locale.trim() : undefined;
  const rawTag =
    typeof payload.tag === 'string' && payload.tag.trim() ? payload.tag.trim() : undefined;
  const rawIcon =
    typeof payload.icon === 'string' && payload.icon.trim() ? payload.icon.trim() : undefined;
  const rawBadge =
    typeof payload.badge === 'string' && payload.badge.trim() ? payload.badge.trim() : undefined;

  const title = computeReminderTitle(rawTitle, rawType, rawLocale);
  const body = computeReminderBody(rawBody, rawType, rawLocale);
  const url = computeReminderUrl(rawUrl, rawType, rawDate);
  const tag = computeReminderTag(rawType, rawId, rawTag);
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
