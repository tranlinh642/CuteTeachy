import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import type { Note, Tag } from '@/types';
import { NotesView } from './NotesView';
import { NoteCard } from './NoteCard';
import { NoteDialog } from './NoteDialog';

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
      <div data-testid="note-dialog" data-title={title}>
        <h1>{title}</h1>
        <div>{children}</div>
        <div>{footer}</div>
      </div>
    ) : null,
}));

const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Chuẩn bị bài học',
    content: 'Nội dung chi tiết',
    checklist: [{ id: 'c1', text: 'In tài liệu', done: false }],
    tagIds: ['tag-1'],
    completed: false,
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-26T10:00:00Z',
  },
];

const mockTags: Tag[] = [{ id: 'tag-1', name: 'Giảng dạy', tone: 'blue', updatedAt: '2026-10-26T10:00:00Z' }];

describe('NotesView Component (S3-FE-04 & S6-FE-01)', () => {
  const renderWithProviders = (element: React.ReactElement, servicesOverride: Record<string, unknown> = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const defaultServices = {
      notes: {
        list: vi.fn().mockResolvedValue({
          items: mockNotes,
          deletedIds: [],
          serverTime: '2026-10-26T10:00:00Z',
          nextCursor: null,
        }),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      },
      tags: {
        list: vi.fn().mockResolvedValue({
          items: mockTags,
          deletedIds: [],
          serverTime: '2026-10-26T10:00:00Z',
        }),
      },
      ...servicesOverride,
    };

    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale="vi">
          <ServicesContext.Provider value={defaultServices as unknown as Parameters<typeof ServicesContext.Provider>[0]['value']}>
            {element}
          </ServicesContext.Provider>
        </I18nProvider>
      </QueryClientProvider>,
    );
  };

  it('renders notes search input and header title', () => {
    const html = renderWithProviders(<NotesView />);
    expect(html).toContain('Ghi chú &amp; Suy nghĩ');
    expect(html).toContain('Tìm ghi chú…');
  });

  it('renders tag filter chip for all notes and tag options', () => {
    const html = renderWithProviders(<NotesView />);
    expect(html).toContain('Tất cả');
  });

  it('renders circular completed checkbox on NoteCard when checklist is empty', () => {
    const noteWithoutChecklist: Note = {
      id: 'note-empty-check',
      title: 'Đọc sách tham khảo',
      checklist: [],
      tagIds: [],
      completed: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };

    const html = renderWithProviders(<NoteCard note={noteWithoutChecklist} />);
    expect(html).toContain('rounded-full');
    expect(html).toContain('type="checkbox"');
  });

  it('renders remindTime badge on NoteCard when note has dueDate and remindTime (S6-FE-01)', () => {
    const noteWithRemind: Note = {
      id: 'note-remind-1',
      title: 'Họp tổ bộ môn',
      checklist: [],
      tagIds: [],
      dueDate: '2026-10-30',
      remindTime: '14:30',
      completed: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };

    const html = renderWithProviders(<NoteCard note={noteWithRemind} />);
    expect(html).toContain('14:30');
  });

  it('renders remindTime TimeField in NoteDialog when editing a note with dueDate (S6-FE-01)', () => {
    const noteWithDueDate: Note = {
      id: 'note-remind-2',
      title: 'Nộp điểm giữa kỳ',
      checklist: [],
      tagIds: [],
      dueDate: '2026-10-30',
      remindTime: '09:15',
      completed: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };

    const html = renderWithProviders(
      <NoteDialog open={true} onClose={vi.fn()} note={noteWithDueDate} />,
    );
    expect(html).toContain('Giờ nhắc');
    expect(html).toContain('09:15');
  });
});
