import type { Locale } from './common.interface';

export const REMINDER_LEAD_MINUTES = [5, 10, 15, 30, 60] as const;
export type ReminderLeadMinutes = (typeof REMINDER_LEAD_MINUTES)[number];

export interface Settings {
  readonly locale: Locale;
  readonly timeZone: string;
  readonly pushEnabled: boolean;
  readonly reminderLeadMinutes: ReminderLeadMinutes;
}

export type UpdateSettingsInput = Partial<Settings>;
