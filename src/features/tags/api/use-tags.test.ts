import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import { createSyncQueryFn, handleGoneError, removeEntityFromCache } from '@/lib/sync';
import type { SyncEnvelope, Tag } from '@/types';
import { ApiError } from '@/lib/api';

describe('useTags and tag query/mutation sync cache management', () => {
  const initialTags: Tag[] = [
    { id: 'tag-1', name: 'Khoa học', tone: 'blue', updatedAt: '2026-10-26T10:00:00Z' },
    { id: 'tag-2', name: 'Lịch sử', tone: 'rose', updatedAt: '2026-10-26T10:00:00Z' },
  ];

  it('populates QueryClient with tags from sync queryFn', async () => {
    const queryClient = new QueryClient();
    const storage = createMemoryStorage();
    const mockEnvelope: SyncEnvelope<Tag> = {
      items: initialTags,
      deletedIds: [],
      serverTime: '2026-10-26T10:00:00Z',
    };
    const fetchFn = vi.fn().mockResolvedValue(mockEnvelope);

    const queryFn = createSyncQueryFn(queryClient, queryKeys.tags.all, fetchFn, storage);
    const result = await queryFn();

    expect(fetchFn).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(initialTags);
    expect(queryClient.getQueryData(queryKeys.tags.all)).toEqual(initialTags);
  });

  it('updates existing tag in query cache on mutation success', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, initialTags);

    const updatedTag: Tag = {
      id: 'tag-1',
      name: 'Khoa học tự nhiên',
      tone: 'mint',
      updatedAt: '2026-10-26T11:00:00Z',
    };

    // Mimic useUpdateTag onSuccess
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) =>
      list.map((item) => (item.id === updatedTag.id ? updatedTag : item)),
    );

    const cached = queryClient.getQueryData<Tag[]>(queryKeys.tags.all);
    expect(cached).toHaveLength(2);
    expect(cached?.find((t) => t.id === 'tag-1')?.name).toBe('Khoa học tự nhiên');
    expect(cached?.find((t) => t.id === 'tag-1')?.tone).toBe('mint');
  });

  it('adds newly created tag to cache idempotently', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, initialTags);

    const newTag: Tag = {
      id: 'tag-3',
      name: 'Toán học',
      tone: 'pink',
      updatedAt: '2026-10-26T11:00:00Z',
    };

    // Mimic useCreateTag onSuccess
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) => {
      const exists = list.some((item) => item.id === newTag.id);
      return exists ? list.map((item) => (item.id === newTag.id ? newTag : item)) : [...list, newTag];
    });

    const cached = queryClient.getQueryData<Tag[]>(queryKeys.tags.all);
    expect(cached).toHaveLength(3);
    expect(cached?.some((t) => t.id === 'tag-3')).toBe(true);

    // Duplicate create does not append duplicate
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, (list = []) => {
      const exists = list.some((item) => item.id === newTag.id);
      return exists ? list.map((item) => (item.id === newTag.id ? newTag : item)) : [...list, newTag];
    });
    expect(queryClient.getQueryData<Tag[]>(queryKeys.tags.all)).toHaveLength(3);
  });

  it('removes tag from query cache on delete success', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, initialTags);

    // Mimic useDeleteTag onSuccess
    removeEntityFromCache(queryClient, queryKeys.tags.all, 'tag-1');

    const cached = queryClient.getQueryData<Tag[]>(queryKeys.tags.all);
    expect(cached).toHaveLength(1);
    expect(cached?.some((t) => t.id === 'tag-1')).toBe(false);
  });

  it('handles 410 gone error by purging entity from cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Tag[]>(queryKeys.tags.all, initialTags);

    const goneError = new ApiError('gone', 'Tag was deleted', 410);
    const handled = handleGoneError(goneError, {
      queryClient,
      queryKey: queryKeys.tags.all,
      entityId: 'tag-1',
    });

    expect(handled).toBe(true);
    const cached = queryClient.getQueryData<Tag[]>(queryKeys.tags.all);
    expect(cached).toHaveLength(1);
    expect(cached?.some((t) => t.id === 'tag-1')).toBe(false);
  });
});
