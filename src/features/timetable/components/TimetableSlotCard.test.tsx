import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TimetableSlot } from '@/types';
import { I18nProvider } from '@/lib/i18n';
import { TimetableSlotCard } from './TimetableSlotCard';

describe('TimetableSlotCard Component (S4-FE-02)', () => {
  const sampleSlot: TimetableSlot = {
    id: 'slot-1',
    weekday: 1,
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Sinh học đại cương',
    grade: 'Lớp 10A1',
    room: 'Phòng 302',
    tone: 'blue',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const renderCard = (slot: TimetableSlot, locale: 'vi' | 'en' = 'vi') => {
    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <TimetableSlotCard
          slot={slot}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </I18nProvider>,
    );
  };

  it('renders slot with time range, subject, grade, room and effective range', () => {
    const html = renderCard(sampleSlot, 'vi');

    expect(html).toContain('Sinh học đại cương');
    expect(html).toContain('08:00 – 09:30');
    expect(html).toContain('Lớp 10A1');
    expect(html).toContain('Phòng 302');
    expect(html).toContain('01/01/2026 – 31/12/2026');
  });

  it('renders slot without grade or room cleanly', () => {
    const minimalSlot: TimetableSlot = {
      ...sampleSlot,
      grade: undefined,
      room: null,
      effectiveTo: null,
    };

    const html = renderCard(minimalSlot, 'vi');

    expect(html).toContain('Sinh học đại cương');
    expect(html).not.toContain('Lớp 10A1');
    expect(html).not.toContain('Phòng 302');
    expect(html).toContain('Từ 01/01/2026');
  });

  it('renders edit and delete/stop action buttons with touch targets >= 44px', () => {
    const html = renderCard(sampleSlot, 'vi');

    expect(html).toContain('size-touch');
    expect(html).toContain('aria-label="Sửa tiết dạy"');
  });
});
