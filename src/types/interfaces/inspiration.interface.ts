import type { ID, Locale } from './common.interface';

/** "Daily Inspiration" quote, localised. */
export interface Inspiration {
  readonly id: ID;
  readonly quote: Readonly<Record<Locale, string>>;
  readonly author?: string;
}
