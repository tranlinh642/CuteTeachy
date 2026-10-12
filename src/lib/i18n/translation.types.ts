import type { vi } from './locales/vi';

/** Shape every locale must implement (derived from the Vietnamese source). */
export type TranslationSchema = typeof vi;

type Join<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`;

/** Dotted path to every leaf string, e.g. `"home.greeting.morning"`. */
export type PathsOf<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? Join<P, K> : PathsOf<T[K], Join<P, K>>;
}[keyof T & string];

export type TranslationKey = PathsOf<TranslationSchema>;

export type TranslationParams = Readonly<Record<string, string | number>>;

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;
