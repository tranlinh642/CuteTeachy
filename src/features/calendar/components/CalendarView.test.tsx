import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { CalendarView } from './CalendarView';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock dialogs
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
      <div data-testid="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock('@/features/tasks', () => ({
  TaskDialog: () => null,
  TaskItem: () => <div data-testid="task-item" />,
  useTaskDialog: () => ({
    open: false,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('../hooks/use-calendar-view', () => ({
  useCalendarView: () => ({
    year: 2026,
    monthIndex: 9,
    monthTitle: 'Tháng 10 năm 2026',
    selectedDate: '2026-10-26',
    selectedDateLabel: 'Thứ Hai, 26 tháng 10',
    selectDate: vi.fn(),
    goToToday: vi.fn(),
    nextMonth: vi.fn(),
    previousMonth: vi.fn(),
    markers: new Map([['2026-10-26', 1]]),
    agenda: [
      {
        kind: 'class',
        id: 'cs_slot-1_2026-10-26',
        item: {
          id: 'cs_slot-1_2026-10-26',
          timetableSlotId: 'slot-1',
          subject: 'Sinh học',
          date: '2026-10-26',
          startTime: '09:00',
          endTime: '10:30',
          tone: 'blue',
          prepItems: [],
          cancelled: false,
          updatedAt: '2026-10-26T00:00:00Z',
        },
      },
    ],
    tagsFor: () => [],
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

describe('CalendarView Integration (S4-FE-03)', () => {
  const renderView = () => {
    return renderToStaticMarkup(
      <I18nProvider defaultLocale="vi">
        <CalendarView />
      </I18nProvider>,
    );
  };

  it('renders "Thêm buổi lẻ" button on agenda header', () => {
    const html = renderView();
    expect(html).toContain('Thêm buổi lẻ');
  });

  it('renders ClassCard for class agenda entries with clickable role', () => {
    const html = renderView();
    expect(html).toContain('Sinh học');
    expect(html).toContain('role="button"');
  });
});
