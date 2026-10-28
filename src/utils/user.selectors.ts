import type { TranslateFn, TranslationKey } from '@/lib/i18n';
import type { Gender, User } from '@/types';
import { DEFAULT_AVATAR_INITIALS } from '@/config';

export type UserProfileName = Readonly<Partial<Pick<User, 'displayName' | 'fullName'>>>;
export type TeacherUser = Readonly<Partial<Pick<User, 'displayName' | 'fullName' | 'gender'>>>;

/**
 * Centralized resolution of effective teacher display name.
 * Trims and prioritizes displayName, falling back to fullName, or an optional fallback.
 */
export function getEffectiveDisplayName(
  user?: UserProfileName | null,
  fallback: string = '',
): string {
  const trimmedDisplay = user?.displayName?.trim();
  if (trimmedDisplay) return trimmedDisplay;
  const trimmedFull = user?.fullName?.trim();
  if (trimmedFull) return trimmedFull;
  return fallback;
}

/**
 * Resolves avatar name/initials string from user, falling back to DEFAULT_AVATAR_INITIALS.
 */
export function getAvatarName(
  user?: UserProfileName | null,
): string {
  return getEffectiveDisplayName(user) || DEFAULT_AVATAR_INITIALS;
}

/**
 * Determines whether the full name subtitle should be shown under the teacher's display name.
 * Only shown when both displayName and fullName exist and differ after trimming.
 */
export function shouldShowFullNameSubtitle(
  user?: UserProfileName | null,
): boolean {
  const trimmedDisplay = user?.displayName?.trim();
  const trimmedFull = user?.fullName?.trim();
  return Boolean(trimmedDisplay && trimmedFull && trimmedDisplay !== trimmedFull);
}

export function getTeacherRoleKey(gender?: Gender | null): TranslationKey {
  if (gender === 'male') return 'profile.roles.male';
  if (gender === 'female') return 'profile.roles.female';
  return 'profile.roles.other';
}

export function getTeacherHonorificKey(gender?: Gender | null): TranslationKey {
  if (gender === 'male') return 'profile.honorifics.male';
  if (gender === 'female') return 'profile.honorifics.female';
  return 'profile.honorifics.other';
}

/**
 * Returns teacher role based on gender ("Thầy giáo" | "Cô giáo" | "Giáo viên").
 */
export function getTeacherRole(gender: Gender | null | undefined, t: TranslateFn): string {
  return t(getTeacherRoleKey(gender));
}

/**
 * Returns honorific prefix ("Thầy" | "Cô" | "").
 */
export function getTeacherHonorific(gender: Gender | null | undefined, t: TranslateFn): string {
  return t(getTeacherHonorificKey(gender));
}

/**
 * Formats display name with honorific prefix if not already present.
 * Supports passing either a TeacherUser directly or separate displayName and gender.
 * Correctly distinguishes full word prefixes (e.g. preserves "Công" without false prefix match).
 */
export function formatTeacherDisplayName(
  user: TeacherUser | null | undefined,
  t: TranslateFn,
): string;
export function formatTeacherDisplayName(
  displayName: string | undefined,
  gender: Gender | null | undefined,
  t: TranslateFn,
): string;
export function formatTeacherDisplayName(
  userOrName: TeacherUser | string | null | undefined,
  genderOrT: Gender | null | TranslateFn | undefined,
  maybeT?: TranslateFn,
): string {
  let displayName: string | undefined;
  let gender: Gender | null | undefined;
  let t: TranslateFn;

  if (typeof genderOrT === 'function') {
    const user = userOrName as TeacherUser | null | undefined;
    displayName = getEffectiveDisplayName(user);
    gender = user?.gender;
    t = genderOrT;
  } else {
    displayName = typeof userOrName === 'string' ? userOrName : getEffectiveDisplayName(userOrName);
    gender = genderOrT;
    t = maybeT!;
  }

  const trimmed = displayName?.trim();
  if (!trimmed) return getTeacherRole(gender, t);
  const prefix = getTeacherHonorific(gender, t).trim();
  if (!prefix) return trimmed;
  const lowerName = trimmed.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  // Check exact match or full-word prefix followed by space
  if (lowerName === lowerPrefix || lowerName.startsWith(`${lowerPrefix} `)) {
    return trimmed;
  }
  return `${prefix} ${trimmed}`;
}

/**
 * Resolves avatar accessibility label for a teacher, falling back to teacher role when name is empty.
 */
export function getTeacherAvatarLabel(
  user: TeacherUser | null | undefined,
  t: TranslateFn,
): string {
  const name = getEffectiveDisplayName(user) || getTeacherRole(user?.gender, t);
  return t('common.a11y.avatar', { name });
}
