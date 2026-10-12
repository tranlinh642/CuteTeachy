import type { Locale } from '@/types';
import { DEFAULT_LOCALE, dictionaries } from './constants';
import type { TranslateFn, TranslationKey, TranslationParams } from './translation.types';

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

const lookup = (dictionary: unknown, key: string): string | undefined => {
  let node: unknown = dictionary;
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : undefined;
};

/** Replaces `{{name}}` placeholders. Unknown placeholders are left untouched. */
export const interpolate = (template: string, params?: TranslationParams): string =>
  params
    ? template.replace(PLACEHOLDER, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    : template;

/**
 * Pure (React-free) translator – usable in stores, validation, tests.
 * Falls back to the default locale, then to the key itself.
 */
export const createTranslator = (locale: Locale): TranslateFn => {
  const primary = dictionaries[locale];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key: TranslationKey, params?: TranslationParams): string => {
    const template = lookup(primary, key) ?? lookup(fallback, key);
    return template === undefined ? key : interpolate(template, params);
  };
};
