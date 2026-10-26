import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { vi as viLocale } from '@/lib/i18n/locales/vi';
import { en as enLocale } from '@/lib/i18n/locales/en';
import { createHttpClient } from '@/lib/api/create-http-client';
import { createServices } from '@/lib/api/services/create-services';
import { ServicesContext } from '@/lib/api/services-context';
import type { Tag } from '@/types';
import { TagEditorDialog } from './TagEditorDialog';

// Mock Dialog and ConfirmDialog to bypass client-only / DOM checks in node test environment
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

describe('TagEditorDialog Component (SPEC-003 & S3-FE-02)', () => {
  const sampleTag: Tag = {
    id: 'tag-1',
    name: 'Khoa học',
    tone: 'blue',
  };

  const renderDialog = (tag: Tag | null, open = true, locale: 'vi' | 'en' = 'vi') => {
    const queryClient = new QueryClient();
    const httpClient = createHttpClient({ mode: 'mock' });
    const services = createServices(httpClient);

    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <ServicesContext.Provider value={services}>
          <QueryClientProvider client={queryClient}>
            <TagEditorDialog
              tag={tag}
              open={open}
              onClose={() => {}}
              onUpdated={() => {}}
              onDeleted={() => {}}
            />
          </QueryClientProvider>
        </ServicesContext.Provider>
      </I18nProvider>,
    );
  };

  describe('i18n completeness for tag editing and deletion', () => {
    it('has all necessary translation keys in both vi and en locales', () => {
      // Vietnamese
      expect(viLocale.tags.editor.editTitle).toBe('Chỉnh sửa thẻ');
      expect(viLocale.tags.editor.save).toBe('Lưu');
      expect(viLocale.tags.editor.delete).toBe('Xóa thẻ');
      expect(viLocale.tags.deleteConfirmTitle).toBe('Xoá thẻ này?');
      expect(viLocale.tags.deleteConfirmMessage).toBeTruthy();
      expect(viLocale.tags.editTag).toBeTruthy();
      expect(viLocale.errors.tagNameTaken).toBe('Tên thẻ đã được sử dụng');

      // English
      expect(enLocale.tags.editor.editTitle).toBe('Edit Tag');
      expect(enLocale.tags.editor.save).toBe('Save');
      expect(enLocale.tags.editor.delete).toBe('Delete tag');
      expect(enLocale.tags.deleteConfirmTitle).toBe('Delete this tag?');
      expect(enLocale.tags.deleteConfirmMessage).toBeTruthy();
      expect(enLocale.tags.editTag).toBeTruthy();
      expect(enLocale.errors.tagNameTaken).toBe('Tag name is already taken');
    });
  });

  describe('Dialog rendering', () => {
    it('returns empty string when tag is null', () => {
      const html = renderDialog(null, true);
      expect(html).toBe('');
    });

    it('returns empty string when open is false', () => {
      const html = renderDialog(sampleTag, false);
      expect(html).toBe('');
    });

    it('renders dialog with tag name, TonePicker, delete button and save button', () => {
      const html = renderDialog(sampleTag, true, 'vi');

      // Dialog title
      expect(html).toContain('Chỉnh sửa thẻ');

      // Name input prefilled
      expect(html).toContain('value="Khoa học"');

      // Tone picker buttons (6 tones)
      expect(html).toContain('aria-label="Chọn màu Hồng phấn"');
      expect(html).toContain('aria-label="Chọn màu Xanh baby"');
      expect(html).toContain('aria-label="Chọn màu Be ấm"');
      expect(html).toContain('aria-label="Chọn màu Oải hương"');
      expect(html).toContain('aria-label="Chọn màu Hồng đào"');
      expect(html).toContain('aria-label="Chọn màu Bạc hà"');

      // Blue tone selected
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('Chọn màu Xanh baby');

      // Footer action buttons
      expect(html).toContain('Xóa thẻ');
      expect(html).toContain('Hủy');
      expect(html).toContain('Lưu');
    });

    it('renders correctly in English locale', () => {
      const html = renderDialog(sampleTag, true, 'en');

      expect(html).toContain('Edit Tag');
      expect(html).toContain('Delete tag');
      expect(html).toContain('Save');
      expect(html).toContain('Cancel');
    });
  });
});
