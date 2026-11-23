import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from '@/lib/api/services-context';
import type { TimetableSlot } from '@/types';
import { TimetableSlotDialog } from './TimetableSlotDialog';

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
        <h1>{title}</h1>
        <div data-testid="dialog-body">{children}</div>
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
}));

describe('TimetableSlotDialog Component (S4-FE-02 & S7-FE-01)', () => {
  const pastSlot: TimetableSlot = {
    id: 'slot-past-1',
    weekday: 1,
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Sinh học',
    grade: '10A',
    room: 'P302',
    tone: 'blue',
    category: 'school_teaching',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const futureSlot: TimetableSlot = {
    id: 'slot-future-1',
    weekday: 2,
    startTime: '10:00',
    endTime: '11:30',
    subject: 'Hóa học',
    grade: '12B',
    room: 'Lab 1',
    tone: 'pink',
    category: 'extra_teaching',
    effectiveFrom: '2099-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const renderDialog = (slot?: TimetableSlot, open = true, locale: 'vi' | 'en' = 'vi') => {
    const queryClient = new QueryClient();
    const httpClient = createHttpClient({ mode: 'mock' });
    const services = createServices(httpClient);

    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <ServicesContext.Provider value={services}>
          <QueryClientProvider client={queryClient}>
            <TimetableSlotDialog
              slot={slot}
              open={open}
              onClose={vi.fn()}
              defaultWeekday={1}
            />
          </QueryClientProvider>
        </ServicesContext.Provider>
      </I18nProvider>,
    );
  };

  it('renders create dialog with title, ScheduleCategory selector, and default fields', () => {
    const html = renderDialog(undefined, true, 'vi');

    expect(html).toContain('Thêm tiết dạy');
    expect(html).toContain('Loại lịch');
    expect(html).toContain('Lịch trên lớp');
    expect(html).toContain('Lịch dạy thêm');
    expect(html).toContain('Lịch học thêm');
    expect(html).toContain('data-testid="schedule-category-selector"');
    expect(html).toContain('Thứ trong tuần');
    expect(html).toContain('Giờ bắt đầu');
    expect(html).toContain('Giờ kết thúc');
    expect(html).toContain('Môn học');
    expect(html).toContain('Lớp học (tùy chọn)');
    expect(html).toContain('Phòng học (tùy chọn)');
    expect(html).toContain('Bảng màu pastel');
    expect(html).toContain('Hiệu lực từ ngày');
    expect(html).not.toContain('data-testid="split-warning-banner"');
  });

  it('pre-selects slot category when editing an existing slot', () => {
    const html = renderDialog(futureSlot, true, 'vi');
    expect(html).toContain('data-testid="category-option-extra_teaching"');
    expect(html).toContain('aria-checked="true"');
  });

  it('renders split warning banner when editing a slot that has already started (effectiveFrom < today)', () => {
    const html = renderDialog(pastSlot, true, 'vi');

    expect(html).toContain('Sửa tiết dạy');
    expect(html).toContain('data-testid="split-warning-banner"');
    expect(html).toContain('Lưu ý về lịch sử giảng dạy');
    expect(html).toContain('Thay đổi sẽ được áp dụng từ hôm nay, các tuần đã qua được giữ nguyên');
  });

  it('does NOT render split warning banner when editing a future slot (effectiveFrom >= today)', () => {
    const html = renderDialog(futureSlot, true, 'vi');

    expect(html).toContain('Sửa tiết dạy');
    expect(html).not.toContain('data-testid="split-warning-banner"');
  });

  it('renders correctly in English locale including category options', () => {
    const html = renderDialog(pastSlot, true, 'en');

    expect(html).toContain('Edit slot');
    expect(html).toContain('Schedule category');
    expect(html).toContain('School class');
    expect(html).toContain('Extra tutoring');
    expect(html).toContain('Self study');
    expect(html).toContain('Teaching history notice');
    expect(html).toContain('Save slot');
    expect(html).toContain('Cancel');
    expect(html).toContain('Mon');
    expect(html).toContain('Sun');
  });
});
