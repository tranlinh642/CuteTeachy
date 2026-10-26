/**
 * Primitive aliases shared by every domain interface.
 *
 * Dates are kept as ISO strings so models stay serialisable (API / storage):
 *   ISODate     → "YYYY-MM-DD"
 *   TimeOfDay   → "HH:mm" (24h)
 *   ISODateTime → full ISO-8601 timestamp
 */
/** Semantic pastel color of tags / classes – never a raw hex value. */
export type Tone = 'pink' | 'blue' | 'beige' | 'lavender' | 'rose' | 'mint';

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

/**
 * Shared sync envelope returned by list endpoints supporting mobile-first sync.
 * SPEC-003: Quy tắc đồng bộ chung
 */
export interface SyncEnvelope<T> {
  readonly items: T[];
  readonly deletedIds: string[];
  readonly serverTime: string;
  readonly nextCursor?: string | null;
}

export type Envelope<T> = SyncEnvelope<T>;
