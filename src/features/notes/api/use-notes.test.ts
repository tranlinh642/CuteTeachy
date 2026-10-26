import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Note, SyncEnvelope } from '@/types';
import { queryKeys } from '@/lib/query';
import { createMemoryStorage } from '@/stores';
import { getStoredServerTime, setStoredServerTime } from '@/lib/sync';
import { syncNotes } from './use-notes';

describe('Note Hooks & Sync Contract (S3-FE-04)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('queryKeys.notes', () => {
    it('produces distinct infinite query keys for different search/filter combinations', () => {
      const defaultKey = queryKeys.notes.infinite();
      const searchKey = queryKeys.notes.infinite({ q: 'toan' });
      const tagKey = queryKeys.notes.infinite({ tagId: 'tag-1' });
      const combinedKey = queryKeys.notes.infinite({ q: 'toan', tagId: 'tag-1' });

      expect(defaultKey).toEqual(['notes', 'infinite', { q: '', tagId: '' }]);
      expect(searchKey).toEqual(['notes', 'infinite', { q: 'toan', tagId: '' }]);
      expect(tagKey).toEqual(['notes', 'infinite', { q: '', tagId: 'tag-1' }]);
      expect(combinedKey).toEqual(['notes', 'infinite', { q: 'toan', tagId: 'tag-1' }]);

      // All keys share the 'notes' root so invalidateQueries({ queryKey: queryKeys.notes.all }) invalidates all
      expect(queryKeys.notes.all).toEqual(['notes']);
    });
  });

  describe('syncNotes (delta sync applied to infinite query pages)', () => {
    const note1: Note = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Note 1',
      checklist: [{ id: 'c1', text: 'Task 1', done: false }],
      tagIds: [],
      completed: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };

    const note2: Note = {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Note 2',
      checklist: [],
      tagIds: [],
      completed: true,
      createdAt: '2026-10-26T09:00:00Z',
      updatedAt: '2026-10-26T09:00:00Z',
    };

    it('applies updated notes and removes deleted notes across loaded infinite query pages', async () => {
      const storage = createMemoryStorage();
      const infiniteKey = queryKeys.notes.infinite();

      // Seed query cache with 2 pages
      queryClient.setQueryData(infiniteKey, {
        pages: [
          {
            items: [note1],
            deletedIds: [],
            serverTime: '2026-10-26T10:00:00Z',
            nextCursor: 'cursor-page-2',
          },
          {
            items: [note2],
            deletedIds: [],
            serverTime: '2026-10-26T10:00:00Z',
            nextCursor: null,
          },
        ],
        pageParams: [undefined, 'cursor-page-2'],
      });

      // Updated note1 (item done, completed=true) and note2 deleted
      const updatedNote1: Note = {
        ...note1,
        checklist: [{ id: 'c1', text: 'Task 1', done: true }],
        completed: true,
        updatedAt: '2026-10-26T11:00:00Z',
      };

      const mockEnvelope: SyncEnvelope<Note> = {
        items: [updatedNote1],
        deletedIds: [note2.id],
        serverTime: '2026-10-26T11:00:00Z',
        nextCursor: null,
      };

      const mockNoteService = {
        list: vi.fn().mockResolvedValue(mockEnvelope),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      };

      await syncNotes(queryClient, mockNoteService as unknown as Parameters<typeof syncNotes>[1], storage);

      const cached = queryClient.getQueryData<{
        pages: Array<{ items: Note[]; serverTime: string }>;
      }>(infiniteKey);

      expect(cached).toBeDefined();
      // Page 1 should contain updatedNote1 with completed: true
      expect(cached!.pages[0]!.items).toHaveLength(1);
      expect(cached!.pages[0]!.items[0]!.completed).toBe(true);

      // Page 2 should have note2 removed (since note2 was in deletedIds)
      expect(cached!.pages[1]!.items).toHaveLength(0);
    });

    it('does not insert new notes into filtered queries (q or tagId) during delta sync', async () => {
      const storage = createMemoryStorage();
      const filteredKey = queryKeys.notes.infinite({ q: 'toan' });

      // Seed filtered query cache with note1
      queryClient.setQueryData(filteredKey, {
        pages: [
          {
            items: [note1],
            deletedIds: [],
            serverTime: '2026-10-26T10:00:00Z',
            nextCursor: null,
          },
        ],
        pageParams: [undefined],
      });

      // Updated note1 and a brand new note3 from delta sync
      const updatedNote1: Note = {
        ...note1,
        title: 'Note 1 (Updated)',
        updatedAt: '2026-10-26T11:00:00Z',
      };

      const note3: Note = {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Note 3 (Unrelated)',
        checklist: [],
        tagIds: [],
        completed: false,
        createdAt: '2026-10-26T11:00:00Z',
        updatedAt: '2026-10-26T11:00:00Z',
      };

      const mockEnvelope: SyncEnvelope<Note> = {
        items: [updatedNote1, note3],
        deletedIds: [],
        serverTime: '2026-10-26T11:00:00Z',
        nextCursor: null,
      };

      const mockNoteService = {
        list: vi.fn().mockResolvedValue(mockEnvelope),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      };

      await syncNotes(queryClient, mockNoteService as unknown as Parameters<typeof syncNotes>[1], storage);

      const cached = queryClient.getQueryData<{
        pages: Array<{ items: Note[]; serverTime: string }>;
      }>(filteredKey);

      expect(cached).toBeDefined();
      // Should update note1
      expect(cached!.pages[0]!.items).toHaveLength(1);
      expect(cached!.pages[0]!.items[0]!.title).toBe('Note 1 (Updated)');
      // Should NOT insert note3
      expect(cached!.pages[0]!.items.some((item) => item.id === note3.id)).toBe(false);
    });

    it('recovers from stale updatedSince by resetting checkpoint and invalidating all note queries', async () => {
      const storage = createMemoryStorage();
      const checkpointKey = queryKeys.notes.syncCheckpoint;
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockNoteService = {
        list: vi.fn().mockRejectedValue({ status: 400, code: 'validation' }),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      };

      // Set initial stale checkpoint using official helper
      await setStoredServerTime(checkpointKey, '2026-09-01T00:00:00Z', storage);

      await expect(
        syncNotes(queryClient, mockNoteService as unknown as Parameters<typeof syncNotes>[1], storage),
      ).rejects.toBeDefined();

      // Stale checkpoint should be removed and queries invalidated
      const remainingCheckpoint = await getStoredServerTime(checkpointKey, storage);
      expect(remainingCheckpoint).toBeNull();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.notes.all });
    });
  });
});
