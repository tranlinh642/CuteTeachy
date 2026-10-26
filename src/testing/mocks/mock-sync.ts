import type { SyncEnvelope } from '@/types';
import { badRequest, conflict, created, gone, noContent, notFound, ok, type MockResponse } from './mock-router';

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface SoftDeletedRecord {
  readonly id: string;
  readonly deletedAt: string;
  readonly userId?: string;
}

export interface SyncItem {
  readonly id: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly userId?: string;
}

/**
 * Validates the `updatedSince` query parameter according to SPEC-003:
 * - Must be a valid ISO date string.
 * - Cannot be older than 30 days relative to `now`.
 */
export const validateUpdatedSince = (
  updatedSince?: string,
  now = new Date(),
): { valid: true; date?: Date } | { valid: false; response: MockResponse } => {
  if (!updatedSince) {
    return { valid: true };
  }

  const date = new Date(updatedSince);
  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      response: badRequest('updatedSince must be a valid ISO string', 'validation'),
    };
  }

  if (now.getTime() - date.getTime() > THIRTY_DAYS_MS) {
    return {
      valid: false,
      response: badRequest('updatedSince cannot be older than 30 days', 'validation'),
    };
  }

  return { valid: true, date };
};

/**
 * Helper to build a standard SyncEnvelope response.
 */
export const createMockSyncEnvelope = <T>(
  items: T[],
  deletedIds: string[] = [],
  serverTime?: string,
  nextCursor?: string | null,
): SyncEnvelope<T> => ({
  items,
  deletedIds,
  serverTime: serverTime ?? new Date().toISOString(),
  nextCursor: nextCursor ?? null,
});

/**
 * In-memory sync collection implementing the rules in SPEC-003 & ADR BE 0003:
 * - Idempotent create (201 new, 200 duplicate same user, 409 different user, 410 soft-deleted).
 * - Partial update (last-write-wins; 404 for deleted or nonexistent).
 * - Soft delete with 30-day tombstone retention (204 on delete, 204 on repeat delete, 404 nonexistent).
 * - Delta list with `updatedSince` filtering, tombstone extraction, and envelope wrapping.
 */
export class MockSyncCollection<T extends SyncItem> {
  private items: T[];
  private tombstones: SoftDeletedRecord[];

  constructor(initialItems: T[] = [], initialTombstones: SoftDeletedRecord[] = []) {
    this.items = [...initialItems];
    this.tombstones = [...initialTombstones];
  }

  public getActiveItems(): T[] {
    return [...this.items];
  }

  public setActiveItems(items: T[]): void {
    this.items = [...items];
  }

  public getTombstones(): readonly SoftDeletedRecord[] {
    return [...this.tombstones];
  }

  /**
   * Purges tombstones older than 30 days.
   */
  public purgeExpiredTombstones(now = new Date()): number {
    const cutoff = now.getTime() - THIRTY_DAYS_MS;
    const initialCount = this.tombstones.length;
    this.tombstones = this.tombstones.filter((t) => new Date(t.deletedAt).getTime() >= cutoff);
    return initialCount - this.tombstones.length;
  }

  /**
   * Idempotent create:
   * - Same ID + same owner -> 200 (returns existing entity).
   * - Soft-deleted ID -> 410 gone.
   * - Same ID + different owner -> 409 id_conflict.
   * - New ID -> 201 (created).
   */
  public create(
    item: T,
    currentUserId?: string,
    now = new Date(),
  ): { status: 200 | 201; data: T } | { error: MockResponse } {
    this.purgeExpiredTombstones(now);

    // 1. Check if already soft-deleted
    const isSoftDeleted = this.tombstones.some((t) => t.id === item.id);
    if (isSoftDeleted) {
      return { error: gone('gone', 'This item has already been deleted') };
    }

    // 2. Check if active item with same ID exists
    const existing = this.items.find((i) => i.id === item.id);
    if (existing) {
      const existingOwner = existing.userId;
      if (existingOwner && currentUserId && existingOwner !== currentUserId) {
        return { error: conflict('id_conflict', 'Identifier belongs to another user') };
      }
      return { status: 200, data: existing };
    }

    // 3. Create fresh item
    const timestamp = now.toISOString();
    const createdItem = {
      ...item,
      createdAt: item.createdAt ?? timestamp,
      updatedAt: item.updatedAt ?? timestamp,
      userId: currentUserId ?? item.userId,
    } as T;

    this.items.push(createdItem);
    return { status: 201, data: createdItem };
  }

  /**
   * Updates an existing active record.
   * Soft-deleted or nonexistent records return 404.
   */
  public update(
    id: string,
    patch: Partial<T>,
    currentUserId?: string,
    now = new Date(),
  ): { data: T } | { error: MockResponse } {
    this.purgeExpiredTombstones(now);

    const isDeleted = this.tombstones.some((t) => t.id === id);
    if (isDeleted) {
      return { error: notFound('not_found', 'Item not found') };
    }

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return { error: notFound('not_found', 'Item not found') };
    }

    const current = this.items[index]!;
    if (currentUserId && current.userId && current.userId !== currentUserId) {
      return { error: notFound('not_found', 'Item not found') };
    }

    const updated = {
      ...current,
      ...patch,
      updatedAt: now.toISOString(),
    } as T;

    this.items[index] = updated;
    return { data: updated };
  }

  /**
   * Soft-deletes a record with 30-day tombstone retention.
   * Repeat DELETE returns 204.
   * Nonexistent records return 404.
   */
  public delete(id: string, currentUserId?: string, now = new Date()): MockResponse {
    this.purgeExpiredTombstones(now);

    // If already deleted, idempotent 204
    if (this.tombstones.some((t) => t.id === id)) {
      return noContent();
    }

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      return notFound('not_found', 'Item not found');
    }

    const target = this.items[index]!;
    if (currentUserId && target.userId && target.userId !== currentUserId) {
      return notFound('not_found', 'Item not found');
    }

    this.items.splice(index, 1);
    this.tombstones.push({
      id,
      deletedAt: now.toISOString(),
      userId: currentUserId ?? target.userId,
    });

    return noContent();
  }

  /**
   * Lists active items with optional delta filtering (`updatedSince`) and deleted IDs.
   */
  public list(
    query: { updatedSince?: string; [key: string]: unknown },
    filterFn?: (item: T) => boolean,
    now = new Date(),
  ): { data: SyncEnvelope<T> } | { error: MockResponse } {
    this.purgeExpiredTombstones(now);

    const validation = validateUpdatedSince(query.updatedSince, now);
    if (!validation.valid) {
      return { error: validation.response };
    }

    const serverTime = now.toISOString();

    if (query.updatedSince) {
      const since = query.updatedSince;
      // Filter active items updated since checkpoint
      const items = this.items.filter((item) => {
        const matchesFilter = filterFn ? filterFn(item) : true;
        const isModified = !item.updatedAt || item.updatedAt > since;
        return matchesFilter && isModified;
      });

      // Filter deleted records deleted since checkpoint
      const deletedIds = this.tombstones
        .filter((t) => t.deletedAt > since)
        .map((t) => t.id);

      return { data: createMockSyncEnvelope(items, deletedIds, serverTime) };
    }

    // Full sync: all active items matching optional filter, no deletedIds
    const items = filterFn ? this.items.filter(filterFn) : [...this.items];
    return { data: createMockSyncEnvelope(items, [], serverTime) };
  }
}

/**
 * Convenience router handler for a sync collection's list endpoint.
 */
export const handleMockSyncList = <T extends SyncItem>(
  collection: MockSyncCollection<T>,
  query: { updatedSince?: string; [key: string]: unknown },
  filterFn?: (item: T) => boolean,
  now = new Date(),
): MockResponse => {
  const result = collection.list(query, filterFn, now);
  if ('error' in result) {
    return result.error;
  }
  return ok(result.data);
};

/**
 * Convenience router handler for a sync collection's create endpoint.
 */
export const handleMockSyncCreate = <T extends SyncItem>(
  collection: MockSyncCollection<T>,
  item: T,
  currentUserId?: string,
  now = new Date(),
): MockResponse => {
  const result = collection.create(item, currentUserId, now);
  if ('error' in result) {
    return result.error;
  }
  return result.status === 200 ? ok(result.data) : created(result.data);
};

/**
 * Convenience router handler for a sync collection's update endpoint.
 */
export const handleMockSyncUpdate = <T extends SyncItem>(
  collection: MockSyncCollection<T>,
  id: string,
  patch: Partial<T>,
  currentUserId?: string,
  now = new Date(),
): MockResponse => {
  const result = collection.update(id, patch, currentUserId, now);
  if ('error' in result) {
    return result.error;
  }
  return ok(result.data);
};

/**
 * Convenience router handler for a sync collection's delete endpoint.
 */
export const handleMockSyncDelete = <T extends SyncItem>(
  collection: MockSyncCollection<T>,
  id: string,
  currentUserId?: string,
  now = new Date(),
): MockResponse => {
  return collection.delete(id, currentUserId, now);
};
