import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import type { Note, Tag } from '@/types';
import { NotesView } from './NotesView';
import { NoteCard } from './NoteCard';

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

describe('NotesView Component (S3-FE-04)', () => {
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
});
