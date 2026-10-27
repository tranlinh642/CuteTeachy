import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/types';
import { PushPromptBanner } from './PushPromptBanner';

describe('PushPromptBanner Component', () => {
  const renderBanner = (onEnable = vi.fn(), onDismiss = vi.fn(), locale: Locale = 'vi') => {
    return renderToStaticMarkup(
      <I18nProvider defaultLocale={locale}>
        <PushPromptBanner onEnable={onEnable} onDismiss={onDismiss} />
      </I18nProvider>,
    );
  };

  it('renders prompt title and action buttons in Vietnamese', () => {
    const html = renderBanner();
    expect(html).toContain('Đừng bỏ lỡ tiết dạy &amp; công việc');
    expect(html).toContain('Bật thông báo nhắc trước để CuteTeachy nhắc bạn trước giờ vào lớp!');
    expect(html).toContain('Bật thông báo');
    expect(html).toContain('Để sau');
  });

  it('renders prompt in English when locale is en', () => {
    const html = renderBanner(vi.fn(), vi.fn(), 'en');
    expect(html).toContain('Never miss a class or task');
    expect(html).toContain('Turn on reminders so CuteTeachy can alert you');
    expect(html).toContain('Turn On');
    expect(html).toContain('Later');
  });
});
