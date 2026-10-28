import { describe, expect, it } from 'vitest';
import {
  getThemeColors,
  getThemeTones,
  resolveActiveTheme,
  shouldResetThemeOnGenderChange,
} from './resolve-theme';

describe('resolve-theme', () => {
  describe('resolveActiveTheme', () => {
    it('defaults to blue for male when auto', () => {
      expect(resolveActiveTheme('male', 'auto')).toBe('blue');
    });

    it('defaults to pink for female when auto', () => {
      expect(resolveActiveTheme('female', 'auto')).toBe('pink');
    });

    it('defaults to pink when gender is undefined/null/other and auto', () => {
      expect(resolveActiveTheme('other', 'auto')).toBe('pink');
      expect(resolveActiveTheme(undefined, 'auto')).toBe('pink');
      expect(resolveActiveTheme(null, 'auto')).toBe('pink');
    });

    it('respects explicit manual override regardless of gender', () => {
      expect(resolveActiveTheme('male', 'pink')).toBe('pink');
      expect(resolveActiveTheme('female', 'blue')).toBe('blue');
      expect(resolveActiveTheme('other', 'blue')).toBe('blue');
      expect(resolveActiveTheme(null, 'blue')).toBe('blue');
    });

    it('matches the inline anti-flash script expression across all gender and preference combinations', () => {
      const genders = ['male', 'female', 'other', undefined, null] as const;
      const preferences = ['auto', 'pink', 'blue', undefined] as const;

      for (const gender of genders) {
        for (const pref of preferences) {
          const expected = resolveActiveTheme(gender, pref ?? 'auto');
          const effectivePref = pref || 'auto';
          const scriptResult =
            effectivePref === 'blue' || (effectivePref === 'auto' && gender === 'male') ? 'blue' : 'pink';
          expect(scriptResult).toBe(expected);
        }
      }
    });
  });

  describe('getThemeColors & getThemeTones', () => {
    it('returns proper primary colors for palettes', () => {
      const blueColors = getThemeColors('blue');
      const pinkColors = getThemeColors('pink');
      expect(blueColors.primary).toBe('#2b5b75');
      expect(pinkColors.primary).toBe('#795465');
    });

    it('returns proper tones for palettes', () => {
      const blueTones = getThemeTones('blue');
      const pinkTones = getThemeTones('pink');
      expect(blueTones.blue.accent).toBe('#2b5b75');
      expect(pinkTones.pink.accent).toBe('#795465');
    });
  });

  describe('shouldResetThemeOnGenderChange', () => {
    it('determines whether theme should reset to auto on gender change', () => {
      // Resets if and only if gender transitions to a different value
      expect(shouldResetThemeOnGenderChange('female', 'male')).toBe(true);
      expect(shouldResetThemeOnGenderChange('male', 'female')).toBe(true);
      expect(shouldResetThemeOnGenderChange('other', 'female')).toBe(true);
      expect(shouldResetThemeOnGenderChange('female', 'other')).toBe(true);
      expect(shouldResetThemeOnGenderChange('male', 'other')).toBe(true);
      expect(shouldResetThemeOnGenderChange('male', null)).toBe(true);
      expect(shouldResetThemeOnGenderChange(null, 'male')).toBe(true);

      // Unchanged gender preserves themePreference
      expect(shouldResetThemeOnGenderChange('male', 'male')).toBe(false);
      expect(shouldResetThemeOnGenderChange('female', 'female')).toBe(false);
      expect(shouldResetThemeOnGenderChange('other', 'other')).toBe(false);
      expect(shouldResetThemeOnGenderChange(null, null)).toBe(false);

      // Undefined new gender
      expect(shouldResetThemeOnGenderChange(undefined, 'male')).toBe(false);
      expect(shouldResetThemeOnGenderChange(undefined, undefined)).toBe(false);
    });
  });
});
