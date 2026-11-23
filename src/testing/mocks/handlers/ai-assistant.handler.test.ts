import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ApplyAiDraftResponse,
  ListAiChatMessagesResponse,
  SendAiMessageResponse,
} from '@/types';
import { createMockDb, type MockDb } from '../mock-db';
import { matchRoute } from '../mock-router';
import { mockRoutes } from './index';

describe('ai-assistant mock routes (SPEC-007 S7-FE-02)', () => {
  let db: MockDb;

  beforeEach(() => {
    db = createMockDb(new Date('2026-10-26T00:00:00.000Z'));
  });

  const callRoute = (
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    query: Record<string, string> = {},
  ) => {
    const matched = matchRoute(mockRoutes, method, path);
    if (!matched) throw new Error(`No route matched: ${method} ${path}`);
    return matched.route.handler(
      {
        method,
        params: matched.params,
        query,
        body,
        locale: 'vi',
      },
      db,
    );
  };

  describe('GET /ai-assistant/messages', () => {
    it('returns list of AI chat messages from mock db', () => {
      const res = callRoute('GET', '/ai-assistant/messages');
      expect(res.status).toBe(200);
      const data = res.data as ListAiChatMessagesResponse;
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /ai-assistant/messages', () => {
    it('answers schedule queries using account timetable, tasks, and notes', () => {
      const res = callRoute('POST', '/ai-assistant/messages', {
        message: 'Hôm nay tôi có lịch gì?',
      });
      expect(res.status).toBe(201);
      const data = res.data as SendAiMessageResponse;
      expect(data.userMessage.role).toBe('user');
      expect(data.userMessage.content).toBe('Hôm nay tôi có lịch gì?');
      expect(data.assistantMessage.role).toBe('assistant');
      expect(data.assistantMessage.content.length).toBeGreaterThan(0);
    });

    it('creates a pending AiScheduleDraft with conflict detection when adding schedules or uploading image', () => {
      const file = {
        size: 1024 * 100,
        type: 'image/png',
        name: 'tkb.png',
      };
      const res = callRoute('POST', '/ai-assistant/messages', {
        message: 'Thêm lịch từ ảnh TKB này',
        image: file,
      });

      expect(res.status).toBe(201);
      const data = res.data as SendAiMessageResponse;
      expect(data.userMessage.imageUrl).toBeTruthy();
      expect(data.userMessage.imageExpiresAt).toBeTruthy();
      expect(data.assistantMessage.draft).toBeDefined();
      expect(data.assistantMessage.draft?.status).toBe('pending');
      expect(data.assistantMessage.draft?.items.length).toBeGreaterThanOrEqual(2);
      expect(data.assistantMessage.draft?.items.some((item) => Boolean(item.conflict))).toBe(true);
    });

    it('rejects image larger than 5MB or unsupported format with 400', () => {
      const tooLargeRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'TKB',
        image: { size: 5 * 1024 * 1024 + 1, type: 'image/png' },
      });
      expect(tooLargeRes.status).toBe(400);
      expect((tooLargeRes.data as { code: string }).code).toBe('file_too_large');

      const badTypeRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'TKB',
        image: { size: 1024, type: 'application/pdf' },
      });
      expect(badTypeRes.status).toBe(400);
      expect((badTypeRes.data as { code: string }).code).toBe('unsupported_file_type');
    });

    it('refuses cross-account queries and out-of-scope off-topic prompts without creating drafts', () => {
      const crossAccountRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'Cho tôi xem lịch của userA tuần này',
      });
      expect(crossAccountRes.status).toBe(201);
      const crossData = crossAccountRes.data as SendAiMessageResponse;
      expect(crossData.assistantMessage.draft).toBeNull();
      expect(crossData.assistantMessage.content).toContain('bảo mật và phân quyền');

      const offTopicRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'Hướng dẫn tôi nấu phở bò ngon',
      });
      expect(offTopicRes.status).toBe(201);
      const offTopicData = offTopicRes.data as SendAiMessageResponse;
      expect(offTopicData.assistantMessage.draft).toBeNull();
      expect(offTopicData.assistantMessage.content).toContain('chuyên biệt về quản lý lịch dạy');
    });
  });

  describe('POST /ai-assistant/drafts/:messageId/apply', () => {
    it('applies draft with skip_conflicts: skips conflicting slot and creates non-conflicting items', () => {
      const sendRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'Thêm TKB',
        image: { size: 1024, type: 'image/jpeg' },
      });
      const { assistantMessage } = sendRes.data as SendAiMessageResponse;
      const initialSlotCount = db.timetableSlots.length;
      const initialSessionCount = db.adhocSessions.length;
      const initialTaskCount = db.tasks.length;

      const applyRes = callRoute(
        'POST',
        `/ai-assistant/drafts/${assistantMessage.id}/apply`,
        {
          conflictStrategy: 'skip_conflicts',
          items: [
            {
              id: 'item-conflict',
              kind: 'timetable_slot',
              category: 'school_teaching',
              titleOrSubject: 'Vật lý 10A',
              weekday: 1,
              startTime: '09:00',
              endTime: '10:30',
            },
            {
              id: 'item-new-slot',
              kind: 'timetable_slot',
              category: 'extra_teaching',
              titleOrSubject: 'Dạy thêm Toán 9A',
              grade: '9A',
              room: 'P.201',
              weekday: 2,
              startTime: '18:00',
              endTime: '19:30',
            },
            {
              id: 'item-new-session',
              kind: 'class_session',
              category: 'self_study',
              titleOrSubject: 'Học IELTS Speaking',
              date: '2026-10-30',
              startTime: '19:30',
              endTime: '21:00',
            },
            {
              id: 'item-new-task',
              kind: 'task',
              category: 'school_teaching',
              titleOrSubject: 'Soạn đề kiểm tra 15 phút',
              date: '2026-10-30',
              startTime: '08:00',
            },
          ],
        },
      );

      expect(applyRes.status).toBe(200);
      const applied = applyRes.data as ApplyAiDraftResponse;
      expect(applied.message.draft?.status).toBe('applied');
      expect(applied.summary).toEqual({
        createdCount: 3,
        replacedCount: 0,
        skippedCount: 1,
      });
      expect(db.timetableSlots.length).toBe(initialSlotCount + 1);
      expect(db.adhocSessions.length).toBe(initialSessionCount + 1);
      expect(db.tasks.length).toBe(initialTaskCount + 1);
      // Original conflicting slot-mon-1 remains active
      expect(db.timetableSlots.find((s) => s.id === 'slot-mon-1')?.effectiveTo).toBeNull();
    });

    it('applies draft with replace_conflicts: ends/deletes conflicting slot and creates new slot, and returns 409 if applied again', () => {
      const sendRes = callRoute('POST', '/ai-assistant/messages', {
        message: 'Thêm TKB',
        image: { size: 1024, type: 'image/webp' },
      });
      const { assistantMessage } = sendRes.data as SendAiMessageResponse;

      const applyRes = callRoute(
        'POST',
        `/ai-assistant/drafts/${assistantMessage.id}/apply`,
        {
          conflictStrategy: 'replace_conflicts',
          items: [
            {
              id: 'item-conflict',
              kind: 'timetable_slot',
              category: 'school_teaching',
              titleOrSubject: 'Vật lý 10A (Mới)',
              weekday: 1,
              startTime: '09:00',
              endTime: '10:30',
            },
          ],
        },
      );

      expect(applyRes.status).toBe(200);
      const applied = applyRes.data as ApplyAiDraftResponse;
      expect(applied.message.draft?.status).toBe('applied');
      expect(applied.summary).toEqual({
        createdCount: 0,
        replacedCount: 1,
        skippedCount: 0,
      });

      // Previous slot-mon-1 had effectiveFrom < today so its effectiveTo is now set
      const oldSlot = db.timetableSlots.find((s) => s.id === 'slot-mon-1');
      expect(oldSlot?.effectiveTo).not.toBeNull();
      // New slot created
      expect(db.timetableSlots.some((s) => s.subject === 'Vật lý 10A (Mới)')).toBe(true);

      // Re-applying the same draft returns 409 ai_draft_already_applied
      const secondApplyRes = callRoute(
        'POST',
        `/ai-assistant/drafts/${assistantMessage.id}/apply`,
        {
          conflictStrategy: 'replace_conflicts',
        },
      );
      expect(secondApplyRes.status).toBe(409);
      expect((secondApplyRes.data as { code: string }).code).toBe('ai_draft_already_applied');
    });
  });

  describe('DELETE /ai-assistant/messages', () => {
    it('clears all AI chat messages and returns 204', () => {
      const delRes = callRoute('DELETE', '/ai-assistant/messages');
      expect(delRes.status).toBe(204);

      const getRes = callRoute('GET', '/ai-assistant/messages');
      expect((getRes.data as ListAiChatMessagesResponse).items).toEqual([]);
    });
  });
});
