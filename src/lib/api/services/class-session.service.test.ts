import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import type { ClassSession, SyncEnvelope } from '@/types';
import { createClassSessionService } from './class-session.service';

describe('classSessionService', () => {
  const createMockHttp = () =>
    ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }) as unknown as AxiosInstance;

  describe('list', () => {
    it('calls GET /class-sessions with date range and optional updatedSince', async () => {
      const http = createMockHttp();
      const mockEnvelope: SyncEnvelope<ClassSession> = {
        items: [
          {
            id: 'cs_1_2026-10-26',
            timetableSlotId: '1',
            subject: 'Sinh học',
            date: '2026-10-26',
            startTime: '09:00',
            endTime: '10:30',
            tone: 'blue',
            prepItems: [],
            cancelled: false,
            updatedAt: '2026-10-26T00:00:00Z',
          },
        ],
        deletedIds: [],
        serverTime: '2026-10-26T00:00:00Z',
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockEnvelope });

      const service = createClassSessionService(http);
      const result = await service.list({
        from: '2026-10-26',
        to: '2026-10-30',
        updatedSince: '2026-10-25T00:00:00Z',
      });

      expect(http.get).toHaveBeenCalledWith('/class-sessions', {
        params: {
          from: '2026-10-26',
          to: '2026-10-30',
          updatedSince: '2026-10-25T00:00:00Z',
        },
      });
      expect(result).toEqual(mockEnvelope);
    });
  });

  describe('create', () => {
    it('creates an ad-hoc session with client id', async () => {
      const http = createMockHttp();
      const mockCreated: ClassSession = {
        id: 'adhoc-uuid',
        timetableSlotId: null,
        subject: 'Dạy thay',
        date: '2026-10-28',
        startTime: '14:00',
        endTime: '15:30',
        tone: 'mint',
        prepItems: [],
        cancelled: false,
        updatedAt: '2026-10-28T00:00:00Z',
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: mockCreated });

      const service = createClassSessionService(http);
      const result = await service.create({
        subject: 'Dạy thay',
        date: '2026-10-28',
        startTime: '14:00',
        endTime: '15:30',
        tone: 'mint',
      });

      expect(http.post).toHaveBeenCalledWith(
        '/class-sessions',
        expect.objectContaining({
          id: expect.any(String),
          subject: 'Dạy thay',
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('patches a class session', async () => {
      const http = createMockHttp();
      const mockUpdated: ClassSession = {
        id: 'cs_1_2026-10-26',
        timetableSlotId: '1',
        subject: 'Sinh học',
        date: '2026-10-26',
        startTime: '09:00',
        endTime: '10:30',
        tone: 'blue',
        topic: 'Bài học mới',
        prepItems: [],
        cancelled: true,
        updatedAt: '2026-10-26T12:00:00Z',
      };
      vi.mocked(http.patch).mockResolvedValueOnce({ data: mockUpdated });

      const service = createClassSessionService(http);
      const result = await service.update('cs_1_2026-10-26', {
        topic: 'Bài học mới',
        cancelled: true,
      });

      expect(http.patch).toHaveBeenCalledWith('/class-sessions/cs_1_2026-10-26', {
        topic: 'Bài học mới',
        cancelled: true,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('deletes an ad-hoc class session', async () => {
      const http = createMockHttp();
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      const service = createClassSessionService(http);
      await service.remove('adhoc-1');

      expect(http.delete).toHaveBeenCalledWith('/class-sessions/adhoc-1');
    });
  });
});
