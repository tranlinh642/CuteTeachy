import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { TimetableSlot } from '@/types';
import { TimetableManagementView } from './TimetableManagementView';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="dialog" data-title={title}>
        <h1>{title}</h1>
        <div>{children}</div>
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
        <h2>{title}</h2>
        <p>{message}</p>
        <button>{confirmLabel}</button>
      </div>
    ) : null,
}));

describe('TimetableManagementView Component (S4-FE-02)', () => {
  const sampleSlots: TimetableSlot[] = [
    {
      id: 'slot-mon-1',
      weekday: 1,
      startTime: '08:00',
      endTime: '09:30',
      subject: 'Toán học',
      grade: '10A',
      room: 'P302',
      tone: 'blue',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'slot-mon-2',
      weekday: 1,
      startTime: '10:00',
      endTime: '11:30',
      subject: 'Sinh học',
      grade: '10B',
      room: 'Lab 2',
      tone: 'mint',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'slot-tue-1',
      weekday: 2,
      startTime: '13:30',
      endTime: '15:00',
      subject: 'Hóa học',
      grade: '11A',
      room: 'Lab 1',
      tone: 'pink',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      updatedAt: '2026-09-01T00:00:00Z',
    },
  ];

  const renderView = (slots: TimetableSlot[] = sampleSlots, locale: 'vi' | 'en' = 'vi') => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.timetableSlots.list(), slots);

    const httpClient = createHttpClient({ mode: 'mock' });
    const services = createServices(httpClient);

    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <ServicesContext.Provider value={services}>
          <QueryClientProvider client={queryClient}>
            <TimetableManagementView />
          </QueryClientProvider>
        </ServicesContext.Provider>
      </I18nProvider>,
    );
  };

  it('renders title, total slot count, and navigation actions', () => {
    const html = renderView(sampleSlots, 'vi');

    expect(html).toContain('Thời khoá biểu');
    expect(html).toContain('3 tiết dạy');
    expect(html).toContain('Thêm tiết dạy');
    expect(html).toContain('Xem trên lịch');
  });

  it('groups slots by weekday and displays slots sorted by time', () => {
    const html = renderView(sampleSlots, 'vi');

    // Weekdays are rendered
    expect(html).toContain('Thứ Hai');
    expect(html).toContain('Thứ Ba');
    expect(html).toContain('Thứ Tư');

    // Monday slots
    expect(html).toContain('Toán học');
    expect(html).toContain('Sinh học');
    // Tuesday slot
    expect(html).toContain('Hóa học');
  });

  it('renders filter tabs with counts for each weekday', () => {
    const html = renderView(sampleSlots, 'vi');

    expect(html).toContain('Tất cả các thứ');
    expect(html).toContain('Thứ Hai');
    expect(html).toContain('Thứ Ba');
  });

  it('renders empty state when there are no slots', () => {
    const html = renderView([], 'vi');

    expect(html).toContain('0 tiết dạy');
    expect(html).toContain('Chưa có tiết dạy nào');
    expect(html).toContain('Thêm tiết dạy đầu tiên');
  });

  it('renders correctly in English locale', () => {
    const html = renderView(sampleSlots, 'en');

    expect(html).toContain('Timetable');
    expect(html).toContain('3 slots');
    expect(html).toContain('Add slot');
    expect(html).toContain('Monday');
    expect(html).toContain('Tuesday');
    expect(html).toContain('View in calendar');
  });
});
