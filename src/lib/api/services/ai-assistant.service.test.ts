import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import type {
  ApplyAiDraftResponse,
  ListAiChatMessagesResponse,
  SendAiMessageResponse,
} from '@/types';
import { createAiAssistantService } from './ai-assistant.service';

describe('aiAssistantService (SPEC-007 S7-FE-02)', () => {
  const createMockHttp = () =>
    ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }) as unknown as AxiosInstance;

  describe('listMessages', () => {
    it('calls GET /ai-assistant/messages with optional limit', async () => {
      const http = createMockHttp();
      const mockResponse: ListAiChatMessagesResponse = {
        items: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Xin chào! Tôi có thể giúp gì cho lịch dạy của bạn?',
            createdAt: '2026-10-29T08:00:00.000Z',
          },
        ],
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: mockResponse });

      const service = createAiAssistantService(http);
      const result = await service.listMessages({ limit: 50 });

      expect(http.get).toHaveBeenCalledWith('/ai-assistant/messages', {
        params: { limit: 50 },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('posts JSON payload when only text message is provided', async () => {
      const http = createMockHttp();
      const mockResponse: SendAiMessageResponse = {
        userMessage: {
          id: 'msg-user-1',
          role: 'user',
          content: 'Hôm nay tôi có lịch gì?',
          createdAt: '2026-10-29T08:01:00.000Z',
        },
        assistantMessage: {
          id: 'msg-ai-1',
          role: 'assistant',
          content: 'Hôm nay bạn có 2 tiết dạy.',
          createdAt: '2026-10-29T08:01:01.000Z',
        },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: mockResponse });

      const service = createAiAssistantService(http);
      const result = await service.sendMessage({ message: 'Hôm nay tôi có lịch gì?' });

      expect(http.post).toHaveBeenCalledWith('/ai-assistant/messages', {
        message: 'Hôm nay tôi có lịch gì?',
      });
      expect(result).toEqual(mockResponse);
    });

    it('posts FormData with multipart/form-data header when image is provided', async () => {
      const http = createMockHttp();
      const file = new File(['dummy-image'], 'tkb.png', { type: 'image/png' });
      const mockResponse: SendAiMessageResponse = {
        userMessage: {
          id: 'msg-user-2',
          role: 'user',
          content: 'Thêm TKB từ ảnh này',
          imageUrl: 'https://cdn.local/tkb.png',
          createdAt: '2026-10-29T08:02:00.000Z',
        },
        assistantMessage: {
          id: 'msg-ai-2',
          role: 'assistant',
          content: 'Tôi đã bóc tách được 1 tiết học.',
          draft: {
            status: 'pending',
            items: [
              {
                id: 'draft-item-1',
                kind: 'timetable_slot',
                category: 'school_teaching',
                titleOrSubject: 'Toán',
                grade: '9A',
                weekday: 2,
                startTime: '07:00',
                endTime: '07:45',
              },
            ],
          },
          createdAt: '2026-10-29T08:02:02.000Z',
        },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: mockResponse });

      const service = createAiAssistantService(http);
      const result = await service.sendMessage({
        message: 'Thêm TKB từ ảnh này',
        image: file,
      });

      expect(http.post).toHaveBeenCalledWith(
        '/ai-assistant/messages',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const sentFormData = vi.mocked(http.post).mock.calls[0]?.[1] as FormData;
      expect(sentFormData.get('message')).toBe('Thêm TKB từ ảnh này');
      expect(sentFormData.get('image')).toBe(file);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('applyDraft', () => {
    it('calls POST /ai-assistant/drafts/:messageId/apply with conflictStrategy and items', async () => {
      const http = createMockHttp();
      const mockResponse: ApplyAiDraftResponse = {
        message: {
          id: 'msg-ai-2',
          role: 'assistant',
          content: 'Tôi đã bóc tách được 1 tiết học.',
          draft: {
            status: 'applied',
            appliedAt: '2026-10-29T08:05:00.000Z',
            conflictStrategy: 'replace_conflicts',
            summary: { createdCount: 1, replacedCount: 0, skippedCount: 0 },
            items: [],
          },
          createdAt: '2026-10-29T08:02:02.000Z',
        },
        summary: { createdCount: 1, replacedCount: 0, skippedCount: 0 },
      };
      vi.mocked(http.post).mockResolvedValueOnce({ data: mockResponse });

      const service = createAiAssistantService(http);
      const result = await service.applyDraft('msg-ai-2', {
        conflictStrategy: 'replace_conflicts',
        items: [
          {
            id: 'draft-item-1',
            kind: 'timetable_slot',
            category: 'school_teaching',
            titleOrSubject: 'Toán',
            weekday: 2,
            startTime: '07:00',
            endTime: '07:45',
          },
        ],
      });

      expect(http.post).toHaveBeenCalledWith('/ai-assistant/drafts/msg-ai-2/apply', {
        conflictStrategy: 'replace_conflicts',
        items: [
          {
            id: 'draft-item-1',
            kind: 'timetable_slot',
            category: 'school_teaching',
            titleOrSubject: 'Toán',
            weekday: 2,
            startTime: '07:00',
            endTime: '07:45',
          },
        ],
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('clearMessages', () => {
    it('calls DELETE /ai-assistant/messages', async () => {
      const http = createMockHttp();
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      const service = createAiAssistantService(http);
      await service.clearMessages();

      expect(http.delete).toHaveBeenCalledWith('/ai-assistant/messages');
    });
  });
});
