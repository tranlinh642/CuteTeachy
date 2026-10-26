import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { Tag } from '@/types';
import { TagPicker } from './TagPicker';

describe('TagPicker Component', () => {
  const sampleTags: Tag[] = [
    { id: 'tag-1', name: 'Khoa học', tone: 'blue' },
    { id: 'tag-2', name: 'Lịch sử', tone: 'rose' },
  ];

  const renderPicker = (selectedIds: string[] = []) => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.tags.all, sampleTags);

    const httpClient = createHttpClient({ mode: 'mock' });
    const services = createServices(httpClient);

    return renderToStaticMarkup(
      <I18nProvider locale="vi">
        <ServicesContext.Provider value={services}>
          <QueryClientProvider client={queryClient}>
            <TagPicker label="Gắn thẻ" selectedIds={selectedIds} onChange={() => {}} />
          </QueryClientProvider>
        </ServicesContext.Provider>
      </I18nProvider>,
    );
  };

  it('renders tag chips with toggle buttons and edit buttons', () => {
    const html = renderPicker(['tag-1']);

    // Check legend label
    expect(html).toContain('Gắn thẻ');

    // Check tag names
    expect(html).toContain('Khoa học');
    expect(html).toContain('Lịch sử');

    // Selected tag has checkmark
    expect(html).toContain('aria-pressed="true"');

    // Check edit buttons with aria-label
    expect(html).toContain('aria-label="Chỉnh sửa thẻ Khoa học"');
    expect(html).toContain('aria-label="Chỉnh sửa thẻ Lịch sử"');

    // Check Add tag button
    expect(html).toContain('Thêm thẻ');
  });
});
