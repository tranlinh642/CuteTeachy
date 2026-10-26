import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createMemoryStorage } from '@/stores';
import type { SyncEnvelope } from '@/types';
import { applyEnvelopeToItems, applySyncEnvelopeToCache } from './apply-envelope';
import { getStoredServerTime } from './server-time-storage';

interface TestItem {
  id: string;
  name: string;
  updatedAt: string;
}

describe('apply-envelope', () => {
  const itemA: TestItem = { id: 'a', name: 'Item A', updatedAt: '2026-10-26T10:00:00Z' };
  const itemB: TestItem = { id: 'b', name: 'Item B', updatedAt: '2026-10-26T10:00:00Z' };
  const itemC: TestItem = { id: 'c', name: 'Item C', updatedAt: '2026-10-26T10:00:00Z' };

  describe('applyEnvelopeToItems (pure updater)', () => {
    it('initializes list from items when currentItems is null or empty', () => {
      const envelope: SyncEnvelope<TestItem> = {
        items: [itemA, itemB],
        deletedIds: [],
        serverTime: '2026-10-26T12:00:00Z',
      };

      const result = applyEnvelopeToItems(null, envelope);
      expect(result).toEqual([itemA, itemB]);
    });

    it('adds new items to an existing list', () => {
      const envelope: SyncEnvelope<TestItem> = {
        items: [itemC],
        deletedIds: [],
        serverTime: '2026-10-26T12:00:00Z',
      };

      const result = applyEnvelopeToItems([itemA, itemB], envelope);
      expect(result).toEqual([itemA, itemB, itemC]);
    });

    it('updates existing items that match id', () => {
      const updatedItemB: TestItem = { id: 'b', name: 'Item B (Modified)', updatedAt: '2026-10-26T12:00:00Z' };
      const envelope: SyncEnvelope<TestItem> = {
        items: [updatedItemB],
        deletedIds: [],
        serverTime: '2026-10-26T12:00:00Z',
      };

      const result = applyEnvelopeToItems([itemA, itemB], envelope);
      expect(result).toEqual([itemA, updatedItemB]);
    });

    it('removes items listed in deletedIds', () => {
      const envelope: SyncEnvelope<TestItem> = {
        items: [],
        deletedIds: ['a'],
        serverTime: '2026-10-26T12:00:00Z',
      };

      const result = applyEnvelopeToItems([itemA, itemB, itemC], envelope);
      expect(result).toEqual([itemB, itemC]);
    });

    it('handles combined add, update, and remove in one pass', () => {
      const updatedItemB: TestItem = { id: 'b', name: 'Item B (Updated)', updatedAt: '2026-10-26T12:00:00Z' };
      const envelope: SyncEnvelope<TestItem> = {
        items: [updatedItemB, itemC],
        deletedIds: ['a'],
        serverTime: '2026-10-26T12:00:00Z',
      };

      const result = applyEnvelopeToItems([itemA, itemB], envelope);
      expect(result).toEqual([updatedItemB, itemC]);
    });
  });

  describe('applySyncEnvelopeToCache (TanStack Query integration)', () => {
    it('updates QueryClient cache and stores serverTime checkpoint', async () => {
      const queryClient = new QueryClient();
      const storage = createMemoryStorage();
      const queryKey = ['test-items'];

      queryClient.setQueryData<TestItem[]>(queryKey, [itemA, itemB]);

      const envelope: SyncEnvelope<TestItem> = {
        items: [{ id: 'b', name: 'Item B (Edited)', updatedAt: '2026-10-26T13:00:00Z' }, itemC],
        deletedIds: ['a'],
        serverTime: '2026-10-26T13:00:00Z',
      };

      const updated = await applySyncEnvelopeToCache(queryClient, queryKey, envelope, storage);

      expect(updated).toEqual([
        { id: 'b', name: 'Item B (Edited)', updatedAt: '2026-10-26T13:00:00Z' },
        itemC,
      ]);
      expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual(updated);

      const storedTime = await getStoredServerTime(queryKey, storage);
      expect(storedTime).toBe('2026-10-26T13:00:00Z');
    });

    it('updates infinite query cache across multiple pages', async () => {
      const queryClient = new QueryClient();
      const storage = createMemoryStorage();
      const queryKey = ['test-infinite-items'];

      queryClient.setQueryData(queryKey, {
        pages: [
          { items: [itemA], deletedIds: [], serverTime: '2026-10-26T10:00:00Z', nextCursor: 'c1' },
          { items: [itemB], deletedIds: [], serverTime: '2026-10-26T10:00:00Z', nextCursor: null },
        ],
        pageParams: [undefined, 'c1'],
      });

      const envelope: SyncEnvelope<TestItem> = {
        items: [
          { id: 'b', name: 'Item B (Updated)', updatedAt: '2026-10-26T14:00:00Z' },
          itemC,
        ],
        deletedIds: ['a'],
        serverTime: '2026-10-26T14:00:00Z',
      };

      const updated = await applySyncEnvelopeToCache(queryClient, queryKey, envelope, storage);

      expect(updated).toEqual([
        itemC,
        { id: 'b', name: 'Item B (Updated)', updatedAt: '2026-10-26T14:00:00Z' },
      ]);

      const cached = queryClient.getQueryData<{
        pages: Array<{ items: TestItem[]; serverTime: string }>;
      }>(queryKey);

      expect(cached?.pages[0]!.items).toEqual([itemC]);
      expect(cached?.pages[1]!.items).toEqual([
        { id: 'b', name: 'Item B (Updated)', updatedAt: '2026-10-26T14:00:00Z' },
      ]);
    });
  });
});
