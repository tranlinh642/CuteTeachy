import { describe, expect, it } from 'vitest';
import {
  handleMockSyncCreate,
  handleMockSyncDelete,
  handleMockSyncList,
  handleMockSyncUpdate,
  MockSyncCollection,
  THIRTY_DAYS_MS,
  validateUpdatedSince,
} from './mock-sync';

interface SampleResource {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

describe('mock-sync infrastructure', () => {
  const baseDate = new Date('2026-10-26T12:00:00.000Z');

  describe('validateUpdatedSince', () => {
    it('returns valid when updatedSince is undefined', () => {
      const result = validateUpdatedSince(undefined, baseDate);
      expect(result.valid).toBe(true);
    });

    it('returns valid for ISO date within 30 days', () => {
      const recent = new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const result = validateUpdatedSince(recent, baseDate);
      expect(result.valid).toBe(true);
    });

    it('returns 400 validation error for malformed date', () => {
      const result = validateUpdatedSince('not-a-date', baseDate);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.response.status).toBe(400);
        expect(result.response.data).toMatchObject({ code: 'validation' });
      }
    });

    it('returns 400 validation error when updatedSince is older than 30 days', () => {
      const tooOld = new Date(baseDate.getTime() - (THIRTY_DAYS_MS + 1000)).toISOString();
      const result = validateUpdatedSince(tooOld, baseDate);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.response.status).toBe(400);
        expect(result.response.data).toMatchObject({ code: 'validation' });
      }
    });
  });

  describe('MockSyncCollection - create (idempotent)', () => {
    it('creates a new record with status 201 and populates timestamps', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const result = collection.create({ id: 'item-1', name: 'Item One' }, 'user-1', baseDate);

      expect('status' in result && result.status).toBe(201);
      if ('data' in result) {
        expect(result.data.id).toBe('item-1');
        expect(result.data.createdAt).toBe(baseDate.toISOString());
        expect(result.data.updatedAt).toBe(baseDate.toISOString());
        expect(result.data.userId).toBe('user-1');
      }
    });

    it('returns 200 with existing record when created again with same id by same owner', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'Original Name' }, 'user-1', baseDate);

      const replayResult = collection.create({ id: 'item-1', name: 'Ignored New Name' }, 'user-1', baseDate);
      expect('status' in replayResult && replayResult.status).toBe(200);
      if ('data' in replayResult) {
        expect(replayResult.data.name).toBe('Original Name');
      }
    });

    it('returns 409 id_conflict when created with an id owned by another user', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'User 1 Item' }, 'user-1', baseDate);

      const conflictResult = collection.create({ id: 'item-1', name: 'User 2 Item' }, 'user-2', baseDate);
      expect('error' in conflictResult).toBe(true);
      if ('error' in conflictResult) {
        expect(conflictResult.error.status).toBe(409);
        expect(conflictResult.error.data).toMatchObject({ code: 'id_conflict' });
      }
    });

    it('returns 410 gone when trying to recreate a soft-deleted id', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'To be deleted' }, 'user-1', baseDate);
      collection.delete('item-1', 'user-1', baseDate);

      const recreateResult = collection.create({ id: 'item-1', name: 'Resurrected?' }, 'user-1', baseDate);
      expect('error' in recreateResult).toBe(true);
      if ('error' in recreateResult) {
        expect(recreateResult.error.status).toBe(410);
        expect(recreateResult.error.data).toMatchObject({ code: 'gone' });
      }
    });
  });

  describe('MockSyncCollection - update', () => {
    it('applies partial patch and updates updatedAt timestamp', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'Initial' }, 'user-1', baseDate);

      const laterDate = new Date(baseDate.getTime() + 60_000);
      const updateResult = collection.update('item-1', { name: 'Patched' }, 'user-1', laterDate);

      expect('data' in updateResult).toBe(true);
      if ('data' in updateResult) {
        expect(updateResult.data.name).toBe('Patched');
        expect(updateResult.data.updatedAt).toBe(laterDate.toISOString());
      }
    });

    it('returns 404 for nonexistent id', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const result = collection.update('nonexistent', { name: 'Foo' }, 'user-1', baseDate);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(404);
      }
    });

    it('returns 404 when updating a soft-deleted record', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'Initial' }, 'user-1', baseDate);
      collection.delete('item-1', 'user-1', baseDate);

      const result = collection.update('item-1', { name: 'Foo' }, 'user-1', baseDate);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(404);
      }
    });
  });

  describe('MockSyncCollection - delete (soft delete with tombstones)', () => {
    it('removes item from active list, records tombstone, returns 204', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'To Delete' }, 'user-1', baseDate);

      const res = collection.delete('item-1', 'user-1', baseDate);
      expect(res.status).toBe(204);
      expect(collection.getActiveItems()).toHaveLength(0);

      const tombstones = collection.getTombstones();
      expect(tombstones).toHaveLength(1);
      expect(tombstones[0]).toMatchObject({ id: 'item-1', deletedAt: baseDate.toISOString() });
    });

    it('returns 204 on repeated delete of already-deleted item (idempotent)', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: 'item-1', name: 'To Delete' }, 'user-1', baseDate);
      collection.delete('item-1', 'user-1', baseDate);

      const repeatedRes = collection.delete('item-1', 'user-1', baseDate);
      expect(repeatedRes.status).toBe(204);
    });

    it('returns 404 when deleting a nonexistent item', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const res = collection.delete('missing-item', 'user-1', baseDate);
      expect(res.status).toBe(404);
    });
  });

  describe('MockSyncCollection - list & envelope', () => {
    it('returns all active items and empty deletedIds when updatedSince is absent', () => {
      const collection = new MockSyncCollection<SampleResource>();
      collection.create({ id: '1', name: 'One' }, 'user-1', baseDate);
      collection.create({ id: '2', name: 'Two' }, 'user-1', baseDate);

      const listResult = collection.list({}, undefined, baseDate);
      expect('data' in listResult).toBe(true);
      if ('data' in listResult) {
        expect(listResult.data.items).toHaveLength(2);
        expect(listResult.data.deletedIds).toEqual([]);
        expect(listResult.data.serverTime).toBe(baseDate.toISOString());
      }
    });

    it('returns delta items and deletedIds when updatedSince is provided', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const t0 = new Date('2026-10-26T10:00:00Z');
      const t1 = new Date('2026-10-26T11:00:00Z');
      const t2 = new Date('2026-10-26T12:00:00Z');

      // Create item 1 and item 2 at t0
      collection.create({ id: '1', name: 'Item 1' }, 'user-1', t0);
      collection.create({ id: '2', name: 'Item 2' }, 'user-1', t0);

      // Delete item 1 at t1
      collection.delete('1', 'user-1', t1);

      // Create item 3 and update item 2 at t2
      collection.create({ id: '3', name: 'Item 3' }, 'user-1', t2);
      collection.update('2', { name: 'Item 2 (Modified)' }, 'user-1', t2);

      // Client queries with updatedSince = t0
      const listResult = collection.list({ updatedSince: t0.toISOString() }, undefined, t2);
      expect('data' in listResult).toBe(true);
      if ('data' in listResult) {
        expect(listResult.data.deletedIds).toEqual(['1']);
        expect(listResult.data.items.map((i) => i.id)).toEqual(['2', '3']);
      }
    });

    it('returns 400 validation error if updatedSince is older than 30 days', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const tooOld = new Date(baseDate.getTime() - (THIRTY_DAYS_MS + 5000)).toISOString();

      const result = collection.list({ updatedSince: tooOld }, undefined, baseDate);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(400);
        expect(result.error.data).toMatchObject({ code: 'validation' });
      }
    });
  });

  describe('tombstone 30-day retention and purge', () => {
    it('purges tombstones older than 30 days', () => {
      const collection = new MockSyncCollection<SampleResource>();
      const thirtyFiveDaysAgo = new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000);

      // Create and delete an item 35 days ago
      collection.create({ id: 'old-1', name: 'Old' }, 'user-1', thirtyFiveDaysAgo);
      collection.delete('old-1', 'user-1', thirtyFiveDaysAgo);

      // Create and delete an item 5 days ago
      collection.create({ id: 'recent-1', name: 'Recent' }, 'user-1', fiveDaysAgo);
      collection.delete('recent-1', 'user-1', fiveDaysAgo);

      expect(collection.getTombstones()).toHaveLength(2);

      // Purge at baseDate
      const purged = collection.purgeExpiredTombstones(baseDate);
      expect(purged).toBe(1);

      const remaining = collection.getTombstones();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe('recent-1');
    });
  });

  describe('router helper handlers', () => {
    it('integrates with mock router handlers', () => {
      const collection = new MockSyncCollection<SampleResource>();

      const createRes = handleMockSyncCreate(collection, { id: 'r-1', name: 'Route Item' }, 'user-1', baseDate);
      expect(createRes.status).toBe(201);

      const listRes = handleMockSyncList(collection, {}, undefined, baseDate);
      expect(listRes.status).toBe(200);

      const updateRes = handleMockSyncUpdate(collection, 'r-1', { name: 'Route Item (New)' }, 'user-1', baseDate);
      expect(updateRes.status).toBe(200);

      const deleteRes = handleMockSyncDelete(collection, 'r-1', 'user-1', baseDate);
      expect(deleteRes.status).toBe(204);
    });
  });
});
