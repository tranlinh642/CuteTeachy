import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ScheduleCategory } from '@/types';
import { I18nProvider } from '@/lib/i18n';
import { CalendarView } from './CalendarView';
import { WeeklyDashboard } from '@/features/weekly/components/WeeklyDashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/features/weekly/components/InspirationCard', () => ({
  InspirationCard: () => <div data-testid="inspiration-card" />,
}));

vi.mock('@/features/weekly/hooks/use-weekly-dashboard', () => ({
  useWeeklyDashboard: () => ({
    weekDays: [new Date('2026-10-26T00:00:00Z')],
    selectedDate: '2026-10-26',
    selectDate: vi.fn(),
    selectedCategory: 'all',
    selectCategory: vi.fn(),
    classes: [
      {
        id: 'cs_slot-1_2026-10-26',
        timetableSlotId: 'slot-1',
        subject: 'Sinh học',
        date: '2026-10-26',
        startTime: '09:00',
        endTime: '10:30',
        tone: 'blue',
        category: 'school_teaching',
        prepItems: [],
        cancelled: false,
        updatedAt: '2026-10-26T00:00:00Z',
      },
      {
        id: 'adhoc-extra-1',
        timetableSlotId: null,
        subject: 'Phụ đạo Toán 9A',
        date: '2026-10-26',
        startTime: '18:00',
        endTime: '19:30',
        tone: 'mint',
        category: 'extra_teaching',
        prepItems: [],
        cancelled: false,
        updatedAt: '2026-10-26T00:00:00Z',
      },
    ],
    tasks: [],
    tagsFor: () => [],
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    isLoading: false,
    refetch: vi.fn(),
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
  TaskItem: ({ task }: { task?: { title?: string } }) => (
    <div data-testid="task-item">{task?.title ?? 'Task'}</div>
  ),
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
    markers: new Map([['2026-10-26', 4]]),
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
          category: 'school_teaching',
          prepItems: [],
          cancelled: false,
          updatedAt: '2026-10-26T00:00:00Z',
        },
      },
      {
        kind: 'class',
        id: 'adhoc-extra-1',
        item: {
          id: 'adhoc-extra-1',
          timetableSlotId: null,
          subject: 'Phụ đạo Toán 9A',
          date: '2026-10-26',
          startTime: '18:00',
          endTime: '19:30',
          tone: 'mint',
          category: 'extra_teaching',
          prepItems: [],
          cancelled: false,
          updatedAt: '2026-10-26T00:00:00Z',
        },
      },
      {
        kind: 'class',
        id: 'adhoc-study-1',
        item: {
          id: 'adhoc-study-1',
          timetableSlotId: null,
          subject: 'Học IELTS Speaking',
          date: '2026-10-26',
          startTime: '20:00',
          endTime: '21:30',
          tone: 'lavender',
          category: 'self_study',
          prepItems: [],
          cancelled: false,
          updatedAt: '2026-10-26T00:00:00Z',
        },
      },
      {
        kind: 'task',
        id: 'task-1',
        item: {
          id: 'task-1',
          title: 'Soạn giáo án tuần 8',
          date: '2026-10-26',
          time: '14:00',
          category: 'school',
          priority: 'high',
          tagIds: [],
          completed: false,
          createdAt: '2026-10-26T00:00:00Z',
          updatedAt: '2026-10-26T00:00:00Z',
        },
      },
    ],
    tagsFor: () => [],
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}));

describe('CalendarView & WeeklyDashboard ScheduleCategory Filtering (S4-FE-03 & S7-FE-01)', () => {
  const renderView = (defaultCategoryFilter: ScheduleCategory | 'all' = 'all', locale: 'vi' | 'en' = 'vi') => {
    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <CalendarView defaultCategoryFilter={defaultCategoryFilter} />
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
    expect(html).toContain('Phụ đạo Toán 9A');
    expect(html).toContain('Học IELTS Speaking');
    expect(html).toContain('role="button"');
  });

  it('renders quick ScheduleCategory filter bar on CalendarView and preserves Tasks when filtering by category', () => {
    const allHtml = renderView('all', 'vi');
    expect(allHtml).toContain('data-testid="calendar-category-filter"');
    expect(allHtml).toContain('data-testid="calendar-category-filter-all"');
    expect(allHtml).toContain('data-testid="calendar-category-filter-school_teaching"');
    expect(allHtml).toContain('data-testid="calendar-category-filter-extra_teaching"');
    expect(allHtml).toContain('data-testid="calendar-category-filter-self_study"');
    expect(allHtml).toContain('Tất cả');
    expect(allHtml).toContain('Lịch trên lớp');
    expect(allHtml).toContain('Lịch dạy thêm');
    expect(allHtml).toContain('Lịch học thêm');
    expect(allHtml).toContain('Soạn giáo án tuần 8');

    const schoolHtml = renderView('school_teaching', 'vi');
    expect(schoolHtml).toContain('Sinh học');
    expect(schoolHtml).not.toContain('Phụ đạo Toán 9A');
    expect(schoolHtml).not.toContain('Học IELTS Speaking');
    expect(schoolHtml).toContain('Soạn giáo án tuần 8');

    const extraHtml = renderView('extra_teaching', 'vi');
    expect(extraHtml).toContain('Phụ đạo Toán 9A');
    expect(extraHtml).not.toContain('Sinh học');
    expect(extraHtml).not.toContain('Học IELTS Speaking');
    expect(extraHtml).toContain('Soạn giáo án tuần 8');

    const studyHtml = renderView('self_study', 'vi');
    expect(studyHtml).toContain('Học IELTS Speaking');
    expect(studyHtml).not.toContain('Sinh học');
    expect(studyHtml).not.toContain('Phụ đạo Toán 9A');
    expect(studyHtml).toContain('Soạn giáo án tuần 8');
  });

  it('renders ScheduleCategory filter bar on WeeklyDashboard and filters weekly ClassSessions (SPEC-007 line 35)', () => {
    const allWeeklyHtml = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <WeeklyDashboard defaultCategoryFilter="all" />
      </I18nProvider>,
    );
    expect(allWeeklyHtml).toContain('data-testid="weekly-category-filter"');
    expect(allWeeklyHtml).toContain('Sinh học');
    expect(allWeeklyHtml).toContain('Phụ đạo Toán 9A');

    const extraWeeklyHtml = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <WeeklyDashboard defaultCategoryFilter="extra_teaching" />
      </I18nProvider>,
    );
    expect(extraWeeklyHtml).toContain('Phụ đạo Toán 9A');
    expect(extraWeeklyHtml).not.toContain('Sinh học');
  });
});
