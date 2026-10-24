import type { ID, ISODateTime, Locale } from './common.interface';

export type Gender = 'female' | 'male' | 'other';
export type LoginProviderKind = 'password' | 'google';

export interface User {
  readonly id: ID;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly loginProviders: LoginProviderKind[];
  readonly fullName: string;
  /** Short name used in greetings ("Chào buổi sáng, Linh!"). */
  readonly displayName: string;
  readonly title?: string;
  readonly gender: Gender | null;
  readonly avatarUrl?: string;
  readonly onboardingCompletedAt: ISODateTime | null;
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
