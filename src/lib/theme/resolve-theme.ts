import type { ColorToken, ThemePalette, Tone } from './tokens';
import { feminineColors, feminineTones, masculineColors, masculineTones } from './tokens';
import type { Gender } from '@/types';

export type ThemePreference = 'auto' | 'pink' | 'blue';

export interface ToneColors {
  readonly bg: string;
  readonly fg: string;
  readonly accent: string;
}

/**
 * Resolves active theme palette:
 * - If preference is explicitly 'pink' or 'blue', respect user choice.
 * - If preference is 'auto', adapt based on gender ('male' -> 'blue', otherwise 'pink').
 */
export function resolveActiveTheme(
  gender?: Gender | null,
  themePreference: ThemePreference = 'auto',
): ThemePalette {
  if (themePreference === 'blue') return 'blue';
  if (themePreference === 'pink') return 'pink';
  if (gender === 'male') return 'blue';
  return 'pink';
}

/**
 * Returns the color tokens for the active theme.
 */
export function getThemeColors(palette: ThemePalette): Readonly<Record<ColorToken, string>> {
  return palette === 'blue' ? masculineColors : feminineColors;
}

/**
 * Returns the category/card tones for the active theme.
 */
export function getThemeTones(palette: ThemePalette): Readonly<Record<Tone, ToneColors>> {
  return palette === 'blue' ? masculineTones : feminineTones;
}

/**
 * Determines whether themePreference should be reset to 'auto' upon profile update.
 * Per ADR 0001:
 * Only resets to 'auto' if gender actually transitions to a different value (newGender !== prevGender).
 */
export function shouldResetThemeOnGenderChange(
  newGender: Gender | null | undefined,
  prevGender: Gender | null | undefined,
): boolean {
  if (newGender === undefined) return false;
  return newGender !== prevGender;
}
