import { describe, expect, it } from 'vitest';
import { formatClassSessionReminderNotification } from './format-notification';

describe('formatClassSessionReminderNotification (SPEC-007)', () => {
  const baseSession = {
    id: 'cs-1',
    date: '2026-10-29',
    startTime: '08:00',
    subject: 'Toán học',
    grade: '9A',
    room: '302',
  };

  it('formats school_teaching prefix in vi and en (and defaults when category is omitted)', () => {
    const viDefault = formatClassSessionReminderNotification('vi', baseSession);
    expect(viDefault.title).toBe('Tiết dạy: Toán học 9A');
    expect(viDefault.body).toBe('Bắt đầu lúc 08:00 tại Phòng 302');

    const enSchool = formatClassSessionReminderNotification('en', {
      ...baseSession,
      category: 'school_teaching',
    });
    expect(enSchool.title).toBe('Class session: Toán học 9A');
    expect(enSchool.body).toBe('Starts at 08:00 in Room 302');
  });

  it('formats extra_teaching prefix in vi and en', () => {
    const viExtra = formatClassSessionReminderNotification('vi', {
      ...baseSession,
      category: 'extra_teaching',
    });
    expect(viExtra.title).toBe('Ca dạy thêm: Toán học 9A');

    const enExtra = formatClassSessionReminderNotification('en', {
      ...baseSession,
      category: 'extra_teaching',
    });
    expect(enExtra.title).toBe('Extra tutoring: Toán học 9A');
  });

  it('formats self_study prefix in vi and en', () => {
    const viStudy = formatClassSessionReminderNotification('vi', {
      ...baseSession,
      subject: 'IELTS Speaking',
      grade: undefined,
      room: null,
      category: 'self_study',
    });
    expect(viStudy.title).toBe('Lịch học: IELTS Speaking');
    expect(viStudy.body).toBe('Bắt đầu lúc 08:00');

    const enStudy = formatClassSessionReminderNotification('en', {
      ...baseSession,
      subject: 'IELTS Speaking',
      grade: undefined,
      room: null,
      category: 'self_study',
    });
    expect(enStudy.title).toBe('Study session: IELTS Speaking');
    expect(enStudy.body).toBe('Starts at 08:00');
  });
});
