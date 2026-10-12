import type { ID, Locale } from './common.interface';

export type Gender = 'female' | 'male' | 'other';

export interface User {
  readonly id: ID;
  readonly fullName: string;
  /** Short name used in greetings ("Chào buổi sáng, Linh!"). */
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly title?: string;
  readonly gender: Gender;
}

export interface UpdateProfileInput {
  readonly fullName?: string;
  readonly displayName?: string;
  readonly title?: string | null;
  readonly gender?: Gender;
}

export interface UserSettings {
  readonly locale: Locale;
  readonly pushNotifications: boolean;
}

