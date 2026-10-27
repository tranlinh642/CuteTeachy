import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ClassSession } from '@/types';
import { I18nProvider } from '@/lib/i18n';
import { SessionDetailDialog } from './SessionDetailDialog';

// Mock Dialog & ConfirmDialog to render markup in node environment
vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="dialog" data-title={title}>
        <h2>{title}</h2>
        <div data-testid="dialog-body">{children}</div>
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({
    open,
    title,
    message,
    confirmLabel,
  }: {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel: string;
  }) =>
    open ? (
      <div data-testid="confirm-dialog" data-title={title}>
        <h3>{title}</h3>
        <p>{message}</p>
        <button>{confirmLabel}</button>
      </div>
    ) : null,
}));

// Mock services
vi.mock('@/lib/api', () => ({
  useServices: () => ({
    classSessions: {
      update: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    },
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    cancelQueries: vi.fn(),
    getQueriesData: vi.fn().mockReturnValue([]),
    setQueriesData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  }),
  useMutation: (options: Record<string, unknown>) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    ...options,
  }),
}));

describe('SessionDetailDialog (S4-FE-03)', () => {
  const generatedSession: ClassSession = {
    id: 'cs_slot-1_2026-10-26',
    timetableSlotId: 'slot-1',
    subject: 'Sinh học',
    grade: 'Lớp 10A1',
    room: 'Phòng 302',
    date: '2026-10-26',
    startTime: '07:30',
    endTime: '09:00',
    tone: 'blue',
    topic: 'Cấu tạo tế bào',
    prepItems: [
      { id: 'prep-1', label: 'Chuẩn bị kính hiển vi', done: false },
      { id: 'prep-2', label: 'In phiếu thực hành', done: true },
    ],
    cancelled: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };

  const adhocSession: ClassSession = {
    id: 'adhoc-uuid-99',
    timetableSlotId: null,
    subject: 'Dạy bù Vật lý',
    grade: 'Lớp 11B2',
    room: 'Phòng 204',
    date: '2026-10-28',
    startTime: '14:00',
    endTime: '15:30',
    tone: 'mint',
    topic: 'Quang hình học',
    prepItems: [{ id: 'prep-3', label: 'Mang thấu kính hội tụ', done: false }],
    cancelled: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };

  const renderDialog = (session: ClassSession | null, open = true) => {
    return renderToStaticMarkup(
      <I18nProvider defaultLocale="vi">
        <SessionDetailDialog session={session} open={open} onClose={vi.fn()} />
      </I18nProvider>,
    );
  };

  it('renders nothing when not open or session is null', () => {
    expect(renderDialog(null, true)).toBe('');
    expect(renderDialog(generatedSession, false)).toBe('');
  });

  describe('Slot-generated session details', () => {
    it('renders subject, grade, room, and timetable slot badge', () => {
      const html = renderDialog(generatedSession);

      expect(html).toContain('Sinh học');
      expect(html).toContain('Lớp 10A1');
      expect(html).toContain('Phòng 302');
      expect(html).toContain('Tiết theo thời khoá biểu');
      expect(html).toContain('Cấu tạo tế bào');
      expect(html).toContain('Chuẩn bị kính hiển vi');
      expect(html).toContain('In phiếu thực hành');
    });

    it('shows cancel button for active generated session', () => {
      const html = renderDialog(generatedSession);
      expect(html).toContain('Huỷ buổi dạy');
    });

    it('shows restore button for cancelled generated session', () => {
      const cancelled: ClassSession = {
        ...generatedSession,
        cancelled: true,
      };
      const html = renderDialog(cancelled);
      expect(html).toContain('Khôi phục buổi dạy');
      expect(html).toContain('Đã huỷ');
    });

    it('STRICT REQUIREMENT: DOES NOT render any delete button for slot-generated session', () => {
      const html = renderDialog(generatedSession);
      expect(html).not.toContain('Xoá buổi lẻ');
      expect(html).not.toContain('Xoá buổi');
      expect(html).not.toContain('Xoá tiết');
    });
  });

  describe('Ad-hoc session details', () => {
    it('renders ad-hoc badge and editable form fields', () => {
      const html = renderDialog(adhocSession);

      expect(html).toContain('Dạy bù / dạy thay');
      expect(html).toContain('Dạy bù Vật lý');
      expect(html).toContain('Lớp 11B2');
      expect(html).toContain('Phòng 204');
      expect(html).toContain('Quang hình học');
    });

    it('renders delete button for ad-hoc session', () => {
      const html = renderDialog(adhocSession);
      expect(html).toContain('Xoá buổi lẻ');
    });
  });
});
