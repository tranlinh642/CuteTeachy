import type { ScheduleCategory } from '@/types';

export interface ClassSessionReminderInput {
  readonly id: string;
  readonly date: string;
  readonly startTime: string;
  readonly subject: string;
  readonly grade?: string | null;
  readonly room?: string | null;
  readonly category?: ScheduleCategory;
}

export interface ClassSessionReminderNotificationPayload {
  readonly title: string;
  readonly body: string;
  readonly url: string;
  readonly data: {
    readonly type: 'class_session';
    readonly id: string;
    readonly date: string;
    readonly url: string;
    readonly [key: string]: unknown;
  };
}

export function getClassSessionReminderPrefix(
  category: ScheduleCategory | undefined,
  locale: string | undefined,
): string {
  const isEn = locale === 'en';
  const resolvedCategory: ScheduleCategory = category ?? 'school_teaching';

  switch (resolvedCategory) {
    case 'extra_teaching':
      return isEn ? 'Extra tutoring' : 'Ca dạy thêm';
    case 'self_study':
      return isEn ? 'Study session' : 'Lịch học';
    case 'school_teaching':
    default:
      return isEn ? 'Class session' : 'Tiết dạy';
  }
}

export function formatClassSessionReminderNotification(
  locale: string | undefined,
  session: ClassSessionReminderInput,
): ClassSessionReminderNotificationPayload;
export function formatClassSessionReminderNotification(
  session: ClassSessionReminderInput,
  locale?: string,
): ClassSessionReminderNotificationPayload;
export function formatClassSessionReminderNotification(
  arg1: string | undefined | ClassSessionReminderInput,
  arg2?: ClassSessionReminderInput | string,
): ClassSessionReminderNotificationPayload {
  const locale = typeof arg1 === 'string' || arg1 === undefined ? arg1 : (arg2 as string | undefined);
  const session = (typeof arg1 === 'object' && arg1 !== null ? arg1 : arg2) as ClassSessionReminderInput;

  const isEn = locale === 'en';
  const prefix = getClassSessionReminderPrefix(session.category, locale);
  const grade = session.grade ? session.grade.trim() : '';
  const title = grade
    ? `${prefix}: ${session.subject} ${grade}`
    : `${prefix}: ${session.subject}`;

  const room = session.room ? session.room.trim() : '';
  let body: string;
  if (isEn) {
    if (room) {
      const roomStr = /^room\b/i.test(room) ? room : `Room ${room}`;
      body = `Starts at ${session.startTime} in ${roomStr}`;
    } else {
      body = `Starts at ${session.startTime}`;
    }
  } else if (room) {
    const roomStr = /^(phòng|p\.)\b/i.test(room) ? room : `Phòng ${room}`;
    body = `Bắt đầu lúc ${session.startTime} tại ${roomStr}`;
  } else {
    body = `Bắt đầu lúc ${session.startTime}`;
  }

  const normalizedDate = session.date.slice(0, 10);
  const url = `/timetable?date=${encodeURIComponent(normalizedDate)}`;

  return {
    title,
    body,
    url,
    data: {
      type: 'class_session',
      id: session.id,
      date: normalizedDate,
      url,
    },
  };
}
