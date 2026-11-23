import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { Services } from '@/lib/api';
import type { AiScheduleDraft, AiScheduleDraftItem } from '@/types';
import {
  AiScheduleDraftCard,
  buildApplyDraftPayload,
  submitAiScheduleDraft,
  updateDraftItemField,
} from './AiScheduleDraftCard';

describe('AiScheduleDraftCard Component (SPEC-007 S7-FE-02)', () => {
  const sampleItems: AiScheduleDraftItem[] = [
    {
      id: 'item-1',
      kind: 'timetable_slot',
      category: 'school_teaching',
      titleOrSubject: 'Sinh học 10A',
      grade: '10A',
      room: 'Phòng 302',
      weekday: 1,
      startTime: '09:00',
      endTime: '10:30',
      conflict: {
        slotId: 'slot-mon-1',
        subject: 'Sinh học',
        startTime: '09:00',
        endTime: '10:30',
      },
    },
    {
      id: 'item-2',
      kind: 'timetable_slot',
      category: 'extra_teaching',
      titleOrSubject: 'Dạy thêm Toán 9A',
      grade: '9A',
      room: 'Phòng 201',
      weekday: 2,
      startTime: '18:00',
      endTime: '19:30',
      conflict: null,
    },
    {
      id: 'item-3',
      kind: 'task',
      category: 'self_study',
      titleOrSubject: 'Ôn đề thi IELTS Reading',
      date: '2026-10-30',
      startTime: '20:00',
      conflict: null,
    },
  ];

  const pendingDraft: AiScheduleDraft = {
    status: 'pending',
    appliedAt: null,
    conflictStrategy: null,
    summary: null,
    items: sampleItems,
  };

  const appliedDraft: AiScheduleDraft = {
    status: 'applied',
    appliedAt: '2026-10-29T08:30:00.000Z',
    conflictStrategy: 'replace_conflicts',
    summary: {
      createdCount: 2,
      replacedCount: 1,
      skippedCount: 0,
    },
    items: sampleItems,
  };

  const renderCard = (
    draft: AiScheduleDraft = pendingDraft,
    props: Partial<React.ComponentProps<typeof AiScheduleDraftCard>> = {},
    locale: 'vi' | 'en' = 'vi',
  ) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const mockServices = {
      aiAssistant: {
        applyDraft: vi.fn(),
      },
    } as unknown as Services;

    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ServicesContext.Provider value={mockServices}>
          <I18nProvider locale={locale}>
            <AiScheduleDraftCard messageId="msg-draft-1" draft={draft} {...props} />
          </I18nProvider>
        </ServicesContext.Provider>
      </QueryClientProvider>,
    );
  };

  it('renders proposed items with checkboxes, quick-edit fields, and conflict warnings', () => {
    const html = renderCard(pendingDraft);

    expect(html).toContain('data-testid="ai-draft-card-msg-draft-1"');
    expect(html).toContain('Bản nháp lịch từ Trợ lý AI');
    expect(html).toContain('Sinh học 10A');
    expect(html).toContain('Dạy thêm Toán 9A');
    expect(html).toContain('Ôn đề thi IELTS Reading');

    // Checkboxes for each item
    expect(html).toContain('data-testid="draft-item-checkbox-item-1"');
    expect(html).toContain('data-testid="draft-item-checkbox-item-2"');
    expect(html).toContain('data-testid="draft-item-checkbox-item-3"');

    // Quick edit fields for titleOrSubject, category, weekday/date, startTime, endTime, grade, room
    expect(html).toContain('data-testid="draft-item-title-item-1"');
    expect(html).toContain('data-testid="draft-item-category-item-1"');
    expect(html).toContain('data-testid="draft-item-weekday-item-1"');
    expect(html).toContain('data-testid="draft-item-start-time-item-1"');
    expect(html).toContain('data-testid="draft-item-end-time-item-1"');
    expect(html).toContain('data-testid="draft-item-grade-item-1"');
    expect(html).toContain('data-testid="draft-item-room-item-1"');
    expect(html).toContain('data-testid="draft-item-date-item-3"');

    // Conflict warning on item-1
    expect(html).toContain('data-testid="draft-item-conflict-item-1"');
    expect(html).toContain('Trùng giờ với: Sinh học (09:00–10:30)');
  });

  it('renders conflict strategy options (replace_conflicts and skip_conflicts) and Confirm button', () => {
    const html = renderCard(pendingDraft);

    expect(html).toContain('data-testid="draft-conflict-strategy"');
    expect(html).toContain('data-testid="conflict-strategy-replace_conflicts"');
    expect(html).toContain('Thay thế lịch trùng');
    expect(html).toContain('data-testid="conflict-strategy-skip_conflicts"');
    expect(html).toContain('Bỏ qua mục trùng');
    expect(html).toContain('data-testid="apply-draft-button"');
    expect(html).toContain('Xác nhận thêm lịch');
  });

  it('supports editing item fields and filtering only selected items when building apply payload', () => {
    const editedItems = updateDraftItemField(sampleItems, 'item-2', {
      titleOrSubject: 'Dạy thêm Toán 9A (Nâng cao)',
      category: 'extra_teaching',
      weekday: 4,
      startTime: '18:30',
      endTime: '20:00',
      grade: '9A1',
      room: 'Phòng 205',
    });

    expect(editedItems[1]?.titleOrSubject).toBe('Dạy thêm Toán 9A (Nâng cao)');
    expect(editedItems[1]?.weekday).toBe(4);
    expect(editedItems[1]?.startTime).toBe('18:30');
    expect(editedItems[1]?.endTime).toBe('20:00');
    expect(editedItems[1]?.grade).toBe('9A1');
    expect(editedItems[1]?.room).toBe('Phòng 205');

    // Uncheck item-1, keep item-2 and item-3 selected
    const selectedIds = new Set(['item-2', 'item-3']);
    const payload = buildApplyDraftPayload(editedItems, selectedIds, 'skip_conflicts');

    expect(payload.conflictStrategy).toBe('skip_conflicts');
    expect(payload.items).toHaveLength(2);
    expect(payload.items?.map((i) => i.id)).toEqual(['item-2', 'item-3']);
  });

  it('calls applyDraft and invalidates timetableSlots, classSessions, classes, and tasks caches on confirm', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const applyDraftSpy = vi.fn().mockResolvedValue({
      message: {
        id: 'msg-draft-1',
        role: 'assistant',
        content: 'Đã lưu lịch',
        draft: appliedDraft,
        createdAt: '2026-10-29T08:00:00.000Z',
      },
      summary: appliedDraft.summary!,
    });

    await submitAiScheduleDraft({
      messageId: 'msg-draft-1',
      items: sampleItems,
      selectedIds: new Set(['item-1', 'item-2']),
      conflictStrategy: 'replace_conflicts',
      applyDraftMutation: async (vars) => {
        const res = await applyDraftSpy(vars);
        await queryClient.invalidateQueries({ queryKey: queryKeys.aiAssistant.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.timetableSlots.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.classSessions.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        return res;
      },
    });

    expect(applyDraftSpy).toHaveBeenCalledWith({
      messageId: 'msg-draft-1',
      conflictStrategy: 'replace_conflicts',
      items: [sampleItems[0], sampleItems[1]],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.timetableSlots.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.classSessions.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.tasks.all });
  });

  it('renders applied status with summary statistics and disables confirm button when draft.status === "applied"', () => {
    const html = renderCard(appliedDraft);

    expect(html).toContain('data-status="applied"');
    expect(html).toContain('Đã áp dụng vào lịch');
    expect(html).toContain('data-testid="draft-applied-summary"');
    expect(html).toContain('Đã thêm 2 mục, thay thế 1 mục, bỏ qua 0 mục trùng.');
    expect(html).toContain('Đã xác nhận thêm lịch');
    expect(html).toMatch(/<button[^>]*disabled[^>]*data-testid="apply-draft-button"/);
  });

  it('renders replace_all_timetable option for new timetable drafts and action badges/target summaries for update, delete, and cancel items', () => {
    const pendingWithSlotsHtml = renderCard(pendingDraft);
    expect(pendingWithSlotsHtml).toContain('data-testid="conflict-strategy-replace_all_timetable"');
    expect(pendingWithSlotsHtml).toContain('Thay toàn bộ TKB cũ');

    const detailedDraft: AiScheduleDraft = {
      status: 'pending',
      items: [
        {
          id: 'upd-1',
          kind: 'timetable_slot',
          action: 'update',
          targetSlotId: 'slot-old-1',
          targetSummary: 'Toán 6A10 (08:50–09:35)',
          category: 'school_teaching',
          titleOrSubject: 'Toán 6A10',
          weekday: 4,
          startTime: '07:00',
          endTime: '07:45',
        },
        {
          id: 'del-1',
          kind: 'timetable_slot',
          action: 'delete',
          targetSlotId: 'slot-old-2',
          targetSummary: 'L9 (13:30–14:15)',
          category: 'extra_teaching',
          titleOrSubject: 'L9',
          weekday: 5,
          startTime: '13:30',
          endTime: '14:15',
        },
        {
          id: 'can-1',
          kind: 'class_session',
          action: 'cancel',
          targetSessionId: 'slot-old-3:2026-10-29',
          targetSummary: 'L7 (13:30–14:15)',
          category: 'extra_teaching',
          titleOrSubject: 'L7',
          date: '2026-10-29',
          startTime: '13:30',
          endTime: '14:15',
        },
      ],
    };

    const html = renderCard(detailedDraft);
    expect(html).toContain('data-testid="draft-item-action-upd-1"');
    expect(html).toContain('Cập nhật');
    expect(html).toContain('Xóa tiết');
    expect(html).toContain('Hủy buổi');
    expect(html).toContain('Áp dụng lên: Toán 6A10 (08:50–09:35)');
    expect(html).toContain('Xác nhận áp dụng thay đổi');
  });
});
