import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { isUuid } from '@/lib/sync';
import type { SyncEnvelope, Tag } from '@/types';
import { createTagService } from './tag.service';

describe('tagService', () => {
  const createMockHttp = () => {
    return {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
  };

  describe('list', () => {
    it('requests all tags without query params when updatedSince is omitted', async () => {
      const http = createMockHttp();
      const mockEnvelope: SyncEnvelope<Tag> = {
        items: [{ id: 'tag-1', name: 'Science', tone: 'blue', updatedAt: '2026-10-26T10:00:00Z' }],
        deletedIds: [],
        serverTime: '2026-10-26T10:00:00Z',
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockEnvelope });

      const service = createTagService(http);
      const result = await service.list();

      expect(http.get).toHaveBeenCalledWith('/tags', { params: undefined });
      expect(result).toEqual(mockEnvelope);
    });

    it('sends updatedSince query parameter when provided', async () => {
      const http = createMockHttp();
      const mockEnvelope: SyncEnvelope<Tag> = {
        items: [{ id: 'tag-2', name: 'Math', tone: 'mint', updatedAt: '2026-10-26T11:00:00Z' }],
        deletedIds: ['tag-old'],
        serverTime: '2026-10-26T11:00:00Z',
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockEnvelope });

      const service = createTagService(http);
      const checkpoint = '2026-10-26T10:00:00Z';
      const result = await service.list(checkpoint);

      expect(http.get).toHaveBeenCalledWith('/tags', { params: { updatedSince: checkpoint } });
      expect(result).toEqual(mockEnvelope);
    });
  });

  describe('create', () => {
    it('generates a valid client UUID when input has no id', async () => {
      const http = createMockHttp();
      vi.mocked(http.post).mockImplementationOnce(async (_url, body) => ({
        data: { ...(body as object), updatedAt: '2026-10-26T10:00:00Z' },
      }));

      const service = createTagService(http);
      const result = await service.create({ name: 'Văn học', tone: 'rose' });

      expect(http.post).toHaveBeenCalledTimes(1);
      const [url, payload] = vi.mocked(http.post).mock.calls[0] as [string, { id: string; name: string; tone: string }];
      expect(url).toBe('/tags');
      expect(payload.name).toBe('Văn học');
      expect(payload.tone).toBe('rose');
      expect(isUuid(payload.id)).toBe(true);
      expect(result.id).toBe(payload.id);
    });

    it('preserves existing client UUID when provided for retry idempotency', async () => {
      const http = createMockHttp();
      const clientUuid = '11111111-2222-4333-8444-555555555555';
      vi.mocked(http.post).mockImplementationOnce(async (_url, body) => ({
        data: body,
      }));

      const service = createTagService(http);
      const result = await service.create({ id: clientUuid, name: 'Lịch sử', tone: 'beige' });

      expect(http.post).toHaveBeenCalledWith('/tags', {
        id: clientUuid,
        name: 'Lịch sử',
        tone: 'beige',
      });
      expect(result.id).toBe(clientUuid);
    });
  });

  describe('update', () => {
    it('sends PATCH request to /tags/:id with partial input', async () => {
      const http = createMockHttp();
      const updatedTag: Tag = {
        id: 'tag-1',
        name: 'Địa lý mới',
        tone: 'lavender',
        updatedAt: '2026-10-26T12:00:00Z',
      };
      vi.mocked(http.patch).mockResolvedValueOnce({ data: updatedTag });

      const service = createTagService(http);
      const result = await service.update('tag-1', { name: 'Địa lý mới', tone: 'lavender' });

      expect(http.patch).toHaveBeenCalledWith('/tags/tag-1', {
        name: 'Địa lý mới',
        tone: 'lavender',
      });
      expect(result).toEqual(updatedTag);
    });
  });

  describe('remove', () => {
    it('sends DELETE request to /tags/:id and resolves void', async () => {
      const http = createMockHttp();
      vi.mocked(http.delete).mockResolvedValueOnce({ data: null });

      const service = createTagService(http);
      const result = await service.remove('tag-to-delete');

      expect(http.delete).toHaveBeenCalledWith('/tags/tag-to-delete');
      expect(result).toBeUndefined();
    });
  });
});
