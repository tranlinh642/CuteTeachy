import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { AdHocSessionDialog } from './AdHocSessionDialog';

// Mock Dialog
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

// Mock services
vi.mock('@/lib/api', () => ({
  useServices: () => ({
    classSessions: {
      create: vi.fn(),
    },
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
  useMutation: (options: Record<string, unknown>) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    ...options,
  }),
}));

describe('AdHocSessionDialog (S4-FE-03)', () => {
  const renderDialog = (open = true, defaultDate = '2026-10-28') => {
    return renderToStaticMarkup(
      <I18nProvider defaultLocale="vi">
        <AdHocSessionDialog open={open} onClose={vi.fn()} defaultDate={defaultDate} />
      </I18nProvider>,
    );
  };

  it('renders nothing when open is false', () => {
    expect(renderDialog(false)).toBe('');
  });

  it('renders form fields: subject, grade, room, date, startTime, endTime, tone, topic', () => {
    const html = renderDialog(true, '2026-10-28');

    // Title
    expect(html).toContain('Thêm buổi lẻ');

    // Fields
    expect(html).toContain('Môn học');
    expect(html).toContain('Lớp');
    expect(html).toContain('Phòng học');
    expect(html).toContain('Ngày');
    expect(html).toContain('Giờ bắt đầu');
    expect(html).toContain('Giờ kết thúc');
    expect(html).toContain('Màu sắc');
    expect(html).toContain('Chủ đề bài dạy');
    expect(html).toContain('Việc cần chuẩn bị');

    // Default buttons
    expect(html).toContain('Thêm buổi');
    expect(html).toContain('Hủy');
  });
});
