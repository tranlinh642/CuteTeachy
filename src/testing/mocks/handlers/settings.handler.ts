import { ENDPOINTS } from '@/lib/api/endpoints';
import { badRequest, ok, route } from '../mock-router';
import { REMINDER_LEAD_MINUTES, type ReminderLeadMinutes, type Settings } from '@/types';

const VALID_LOCALES = ['vi', 'en'] as const;

export const isValidIanaTimeZone = (tz: unknown): boolean => {
  if (typeof tz !== 'string' || !tz.trim()) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const settingsRoutes = [
  route('GET', ENDPOINTS.settings.me, (_request, db) => {
    return ok(db.settings);
  }),

  route('PATCH', ENDPOINTS.settings.me, (request, db) => {
    const body = (request.body ?? {}) as Partial<Settings>;

    if (body.locale !== undefined) {
      if (typeof body.locale !== 'string' || !VALID_LOCALES.includes(body.locale as (typeof VALID_LOCALES)[number])) {
        return badRequest('locale must be vi or en');
      }
    }

    if (body.timeZone !== undefined) {
      if (!isValidIanaTimeZone(body.timeZone)) {
        return badRequest('timeZone must be a valid IANA time zone');
      }
    }

    if (body.pushEnabled !== undefined) {
      if (typeof body.pushEnabled !== 'boolean') {
        return badRequest('pushEnabled must be a boolean');
      }
    }

    if (body.reminderLeadMinutes !== undefined) {
      if (
        typeof body.reminderLeadMinutes !== 'number' ||
        !REMINDER_LEAD_MINUTES.includes(body.reminderLeadMinutes as ReminderLeadMinutes)
      ) {
        return badRequest('reminderLeadMinutes must be one of 5, 10, 15, 30, 60');
      }
    }

    db.settings = {
      ...db.settings,
      ...(body.locale !== undefined ? { locale: body.locale } : {}),
      ...(body.timeZone !== undefined ? { timeZone: body.timeZone } : {}),
      ...(body.pushEnabled !== undefined ? { pushEnabled: body.pushEnabled } : {}),
      ...(body.reminderLeadMinutes !== undefined ? { reminderLeadMinutes: body.reminderLeadMinutes } : {}),
    };

    return ok(db.settings);
  }),
];
