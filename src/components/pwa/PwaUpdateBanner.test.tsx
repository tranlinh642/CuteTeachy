import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { PwaUpdateBanner } from './PwaUpdateBanner';

describe('PwaUpdateBanner', () => {
  it('renders nothing by default when no update is available', () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <PwaUpdateBanner />
      </I18nProvider>,
    );
    expect(html).toBe('');
  });

  it('renders update notification banner with action buttons when visible', () => {
    const htmlVi = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <PwaUpdateBanner forceVisible />
      </I18nProvider>,
    );
    expect(htmlVi).toContain('data-testid="pwa-update-banner"');
    expect(htmlVi).toContain('Đã có phiên bản mới');
    expect(htmlVi).toContain('Cập nhật ngay');
    expect(htmlVi).toContain('Để sau');

    const htmlEn = renderToStaticMarkup(
      <I18nProvider locale="en">
        <PwaUpdateBanner forceVisible />
      </I18nProvider>,
    );
    expect(htmlEn).toContain('New version available');
    expect(htmlEn).toContain('Update now');
  });
});
