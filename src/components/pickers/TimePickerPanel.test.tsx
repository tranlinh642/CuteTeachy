import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { TimePickerPanel } from './TimePickerPanel';

describe('TimePickerPanel swipeable wheel UX', () => {
  it('renders 24-hour (00-23) and 60-minute (00-59) swipe wheels with vaul no-drag guard in Vietnamese locale', () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="vi">
        <TimePickerPanel value="08:15" onChange={vi.fn()} />
      </I18nProvider>,
    );

    expect(html).toContain('data-vaul-no-drag');
    expect(html).toContain('snap-y snap-mandatory');
    expect(html).toContain('Giờ');
    expect(html).toContain('Phút');
    expect(html).toContain('Vuốt lên hoặc xuống để chọn nhanh giờ, phút');
    expect(html).toContain('aria-valuenow="8"');
    expect(html).toContain('aria-valuenow="15"');
    expect(html).toContain('>23</button>');
    expect(html).toContain('>59</button>');
  });

  it('renders 12-hour wheel with AM/PM control in English locale', () => {
    const html = renderToStaticMarkup(
      <I18nProvider locale="en">
        <TimePickerPanel value="14:30" onChange={vi.fn()} />
      </I18nProvider>,
    );

    expect(html).toContain('Hour');
    expect(html).toContain('Minute');
    expect(html).toContain('AM');
    expect(html).toContain('PM');
    expect(html).toContain('aria-valuetext="02"');
    expect(html).toContain('aria-valuetext="30"');
  });
});
