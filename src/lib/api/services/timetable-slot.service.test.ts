import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import type { PatchTimetableSlotResult, SyncEnvelope, TimetableSlot } from '@/types';
import { createTimetableSlotService } from './timetable-slot.service';

describe('timetableSlotService', () => {
  const createMockHttp = () =>
    ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }) as unknown as AxiosInstance;

  describe('list', () => {
    it('calls GET /timetable-slots with optional updatedSince', async () => {
      const http = createMockHttp();
      const mockEnvelope: SyncEnvelope<TimetableSlot> = {
        items: [
          {
            id: 'slot-1',
            weekday: 1,
            startTime: '09:00',
            endTime: '10:30',
            subject: 'Sinh học',
            tone: 'blue',
            effectiveFrom: '2026-01-01',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        deletedIds: [],
        serverTime: '2026-01-01T00:00:00Z',
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockEnvelope });

      const service = createTimetableSlotService(http);
      const result = await service.list({ updatedSince: '2026-01-01T00:00:00Z' });

      expect(http.get).toHaveBeenCalledWith('/timetable-slots', {
        params: { updatedSince: '2026-01-01T00:00:00Z' },
      });
      expect(result).toEqual(mockEnvelope);
    });
  });

  describe('create', () => {
    it('creates a timetable slot with generated client id', async () => {
      const http = createMockHttp();
      const mockCreated: TimetableSlot = {
        id: 'slot-uuid',
        weekday: 2,
        startTime: '10:00',
        endTime: '11:30',
        subject: 'Hóa học',
        tone: 'beige',
        effectiveFrom: '2026-01-01',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: mockCreated });

      const service = createTimetableSlotService(http);
      const result = await service.create({
        weekday: 2,
        startTime: '10:00',
        endTime: '11:30',
        subject: 'Hóa học',
        tone: 'beige',
        effectiveFrom: '2026-01-01',
      });

      expect(http.post).toHaveBeenCalledWith(
        '/timetable-slots',
        expect.objectContaining({
          id: expect.any(String),
          subject: 'Hóa học',
        }),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('patches a timetable slot', async () => {
      const http = createMockHttp();
      const mockResult: PatchTimetableSlotResult = {
        current: {
          id: 'slot-1',
          weekday: 1,
          startTime: '09:00',
          endTime: '10:30',
          subject: 'Sinh học nâng cao',
          tone: 'blue',
          effectiveFrom: '2026-01-01',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      };
      vi.mocked(http.patch).mockResolvedValueOnce({ data: mockResult });

      const service = createTimetableSlotService(http);
      const result = await service.update('slot-1', { subject: 'Sinh học nâng cao' });

      expect(http.patch).toHaveBeenCalledWith('/timetable-slots/slot-1', {
        subject: 'Sinh học nâng cao',
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('deletes a timetable slot', async () => {
      const http = createMockHttp();
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      const service = createTimetableSlotService(http);
      await service.remove('slot-1');

      expect(http.delete).toHaveBeenCalledWith('/timetable-slots/slot-1');
    });
  });
});
