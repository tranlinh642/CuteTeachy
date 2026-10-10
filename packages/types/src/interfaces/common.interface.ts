/**
 * Primitive aliases shared by every domain interface.
 *
 * Dates are kept as ISO strings so models stay serialisable (API / storage):
 *   ISODate     → "YYYY-MM-DD"
 *   TimeOfDay   → "HH:mm" (24h)
 *   ISODateTime → full ISO-8601 timestamp
 */
import type { Tone } from '@cute-teachy/tokens';

/** Semantic pastel color of tags / classes – never a raw hex value. */
export type { Tone };

export type ID = string;
export type ISODate = string;
export type TimeOfDay = string;
export type ISODateTime = string;

export type Locale = 'vi' | 'en';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Fields managed by the server on every persisted entity. */
export interface Timestamps {
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}
