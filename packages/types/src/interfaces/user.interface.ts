import type { ID, Locale } from './common.interface';

export interface User {
  readonly id: ID;
  readonly fullName: string;
  /** Short name used in greetings ("Chào buổi sáng, Linh!"). */
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly title?: string;
}

export interface UserSettings {
  readonly locale: Locale;
  readonly pushNotifications: boolean;
}
