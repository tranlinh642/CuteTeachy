import type { Locale } from '@cute-teachy/types';
import { en } from './locales/en';
import { vi } from './locales/vi';
import type { TranslationSchema } from './translation.types';

export const SUPPORTED_LOCALES = ['vi', 'en'] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = 'vi';

/** BCP-47 tags used with `Intl` (dates, numbers). */
export const LOCALE_TAGS: Readonly<Record<Locale, string>> = {
  vi: 'vi-VN',
  en: 'en-US',
};

export const dictionaries: Readonly<Record<Locale, TranslationSchema>> = { vi, en };

export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
