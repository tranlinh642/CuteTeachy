import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { isUuid } from '@/lib/sync';
import type { Note, SyncEnvelope } from '@/types';
import { createNoteService } from './note.service';

describe('noteService', () => {
  const createMockHttp = () => {
    return {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
  };

  describe('list', () => {
    it('requests notes with given params', async () => {
      const http = createMockHttp();
      const mockEnvelope: SyncEnvelope<Note> = {
        items: [
          {
            id: 'note-1',
            title: 'Test Note',
            checklist: [],
            tagIds: [],
            completed: false,
            createdAt: '2026-10-26T10:00:00Z',
            updatedAt: '2026-10-26T10:00:00Z',
          },
        ],
        deletedIds: [],
        serverTime: '2026-10-26T10:00:00Z',
        nextCursor: null,
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockEnvelope });

      const service = createNoteService(http);
      const result = await service.list({ limit: 10, q: 'test', tagId: 'tag-1' });

      expect(http.get).toHaveBeenCalledWith('/notes', {
        params: { limit: 10, q: 'test', tagId: 'tag-1' },
      });
      expect(result).toEqual(mockEnvelope);
    });
  });

  describe('create', () => {
    it('generates a valid client UUID for note and for checklist items without id', async () => {
      const http = createMockHttp();
      vi.mocked(http.post).mockImplementationOnce(async (_url, body) => ({
        data: { ...(body as object), createdAt: '2026-10-26T10:00:00Z', updatedAt: '2026-10-26T10:00:00Z' },
      }));

      const service = createNoteService(http);
      const result = await service.create({
        title: 'New note',
        checklist: [
          { id: '', text: 'Item 1', done: false },
          { id: '11111111-1111-4111-8111-111111111111', text: 'Item 2', done: true },
        ],
      });

      expect(isUuid(result.id)).toBe(true);
      expect(result.checklist).toHaveLength(2);
      expect(isUuid(result.checklist[0]!.id)).toBe(true);
      expect(result.checklist[1]!.id).toBe('11111111-1111-4111-8111-111111111111');
    });
  });

  describe('update', () => {
    it('calls patch on /notes/:id', async () => {
      const http = createMockHttp();
      vi.mocked(http.patch).mockResolvedValueOnce({
        data: { id: 'note-1', title: 'Updated' },
      });

      const service = createNoteService(http);
      const result = await service.update('note-1', { title: 'Updated' });

      expect(http.patch).toHaveBeenCalledWith('/notes/note-1', { title: 'Updated' });
      expect(result).toEqual({ id: 'note-1', title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('calls delete on /notes/:id and resolves void', async () => {
      const http = createMockHttp();
      vi.mocked(http.delete).mockResolvedValueOnce({ data: null });

      const service = createNoteService(http);
      await service.remove('note-1');

      expect(http.delete).toHaveBeenCalledWith('/notes/note-1');
    });
  });
});
