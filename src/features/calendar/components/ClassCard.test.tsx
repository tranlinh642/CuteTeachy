import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ClassSession } from '@/types';
import { I18nProvider } from '@/lib/i18n';
import { ClassCard } from './ClassCard';

describe('ClassCard Component (S4-FE-01, S4-FE-03 & S7-FE-01)', () => {
  const baseSession: ClassSession = {
    id: 'cs_1_2026-10-26',
    timetableSlotId: 'slot-1',
    subject: 'Sinh học',
    grade: 'Lớp 10',
    room: 'Phòng 302',
    date: '2026-10-26',
    startTime: '09:00',
    endTime: '10:30',
    tone: 'blue',
    category: 'school_teaching',
    topic: 'Hô hấp tế bào',
    prepItems: [{ id: 'p1', label: 'In phiếu bài tập', done: false }],
    cancelled: false,
    updatedAt: '2026-10-26T00:00:00Z',
  };

  const renderCard = (session: ClassSession, locale: 'vi' | 'en' = 'vi') => {
    return renderToStaticMarkup(
      <I18nProvider locale={locale}>
        <ClassCard session={session} />
      </I18nProvider>,
    );
  };

  it('renders regular session with room, time, category badge, and prep items', () => {
    const html = renderCard(baseSession);

    expect(html).toContain('Sinh học – Lớp 10');
    expect(html).toContain('Phòng 302');
    expect(html).toContain('Lịch trên lớp');
    expect(html).toContain('data-testid="class-category-badge"');
    expect(html).toContain('In phiếu bài tập');
    expect(html).not.toContain('Đã huỷ');
    expect(html).not.toContain('Dạy bù/thay');
  });

  it('renders distinct badges for extra_teaching and self_study categories', () => {
    const extraHtml = renderCard({ ...baseSession, category: 'extra_teaching' });
    expect(extraHtml).toContain('Lịch dạy thêm');
    expect(extraHtml).toContain('data-testid="class-category-badge"');

    const studyHtml = renderCard({ ...baseSession, category: 'self_study' });
    expect(studyHtml).toContain('Lịch học thêm');
    expect(studyHtml).toContain('data-testid="class-category-badge"');
  });

  it('renders cancelled session with dimmed styling, strike-through, and screen-reader label', () => {
    const cancelledSession: ClassSession = {
      ...baseSession,
      cancelled: true,
    };

    const html = renderCard(cancelledSession);

    expect(html).toContain('Đã huỷ');
    expect(html).toContain('Buổi học đã huỷ');
    expect(html).toContain('line-through');
    expect(html).toContain('opacity-60');
  });

  it('renders ad-hoc session with "Dạy bù/thay" badge', () => {
    const adhocSession: ClassSession = {
      ...baseSession,
      timetableSlotId: null,
      subject: 'Dạy bù Hóa học',
    };

    const html = renderCard(adhocSession);

    expect(html).toContain('Dạy bù/thay');
  });

  it('safely handles empty or null room without rendering room icon or blank space', () => {
    const noRoomSession: ClassSession = {
      ...baseSession,
      room: null,
    };

    const html = renderCard(noRoomSession);

    expect(html).not.toContain('Phòng 302');
    expect(html).not.toContain('school');
  });

  it('renders interactive attributes when onClick is provided', () => {
    const html = renderToStaticMarkup(
      <I18nProvider defaultLocale="vi">
        <ClassCard session={baseSession} onClick={() => {}} />
      </I18nProvider>,
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('cursor-pointer');
  });
});
