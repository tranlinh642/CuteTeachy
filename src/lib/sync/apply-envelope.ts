import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { SyncEnvelope } from '@/types';
import type { KeyValueStorage } from '@/stores';
import { setStoredServerTime } from './server-time-storage';

/**
 * Pure function that applies a SyncEnvelope to an existing array of items:
 * 1. Removes any item whose `id` is present in `envelope.deletedIds`.
 * 2. Updates existing items that match `id` in `envelope.items`.
 * 3. Appends new items that do not yet exist.
 */
export const applyEnvelopeToItems = <T extends { id: string }>(
  currentItems: readonly T[] | undefined | null,
  envelope: SyncEnvelope<T>,
): T[] => {
  const baseItems = currentItems ?? [];
  const deletedSet = new Set(envelope.deletedIds);

  // 1. Remove deleted items
  const surviving = baseItems.filter((item) => !deletedSet.has(item.id));

  // 2 & 3. Upsert items from envelope
  const itemMap = new Map<string, T>();
  const idOrder: string[] = [];

  for (const item of surviving) {
    itemMap.set(item.id, item);
    idOrder.push(item.id);
  }

  for (const newItem of envelope.items) {
    if (deletedSet.has(newItem.id)) continue;

    if (!itemMap.has(newItem.id)) {
      idOrder.push(newItem.id);
    }
    itemMap.set(newItem.id, newItem);
  }

  return idOrder.map((id) => itemMap.get(id)!);
};

/**
 * Applies a SyncEnvelope to the TanStack Query cache and persists the `serverTime` checkpoint.
 * Supports flat array cache, single envelope cache (`{ items: [] }`), and infinite queries (`{ pages: [] }`).
 */
export const applySyncEnvelopeToCache = async <T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey | string,
  envelope: SyncEnvelope<T>,
  storage?: KeyValueStorage,
): Promise<T[]> => {
  const key = (Array.isArray(queryKey) ? queryKey : [queryKey]) as QueryKey;

  queryClient.setQueryData(key, (old: unknown) => {
    if (Array.isArray(old)) {
      return applyEnvelopeToItems(old as T[], envelope);
    }
    if (old && typeof old === 'object' && 'items' in old && Array.isArray((old as { items: unknown }).items)) {
      return {
        ...old,
        items: applyEnvelopeToItems((old as { items: T[] }).items, envelope),
        serverTime: envelope.serverTime,
      };
    }
    if (old && typeof old === 'object' && 'pages' in old && Array.isArray((old as { pages: unknown[] }).pages)) {
      const infiniteOld = old as {
        pages: Array<SyncEnvelope<T> | { items: T[]; [key: string]: unknown }>;
        pageParams: unknown[];
      };
      const deletedSet = new Set(envelope.deletedIds);
      const updatedMap = new Map(envelope.items.map((i) => [i.id, i]));
      const existingIds = new Set(infiniteOld.pages.flatMap((p) => p.items.map((i) => i.id)));

      const updatedPages = infiniteOld.pages.map((page, index) => {
        const remainingItems = page.items
          .filter((item) => !deletedSet.has(item.id))
          .map((item) => updatedMap.get(item.id) ?? item);

        if (index === 0) {
          const newItems = envelope.items.filter(
            (item) => !deletedSet.has(item.id) && !existingIds.has(item.id),
          );
          return {
            ...page,
            items: [...newItems, ...remainingItems],
            serverTime: envelope.serverTime,
          };
        }

        return {
          ...page,
          items: remainingItems,
          serverTime: envelope.serverTime,
        };
      });

      return {
        ...infiniteOld,
        pages: updatedPages,
      };
    }
    return applyEnvelopeToItems([], envelope);
  });

  if (envelope.serverTime) {
    await setStoredServerTime(key, envelope.serverTime, storage);
  }

  const updated = queryClient.getQueryData<
    T[] | { items: T[] } | { pages: Array<{ items: T[] }> }
  >(key);
  if (Array.isArray(updated)) return updated;
  if (updated && 'items' in updated && Array.isArray(updated.items)) return updated.items;
  if (updated && 'pages' in updated && Array.isArray(updated.pages)) {
    return updated.pages.flatMap((p) => p.items);
  }
  return envelope.items;
};
