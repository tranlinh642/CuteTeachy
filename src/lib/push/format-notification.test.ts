import { describe, expect, it } from 'vitest';
import {
  computeReminderBody,
  computeReminderTag,
  computeReminderTitle,
  computeReminderUrl,
  DEFAULT_NOTIFICATION_BADGE,
  DEFAULT_NOTIFICATION_ICON,
  formatNotification,
  formatPushNotification,
} from './format-notification';

describe('formatPushNotification (S5-FE-02)', () => {
  describe('Full payload cases', () => {
    it('formats a complete task reminder payload correctly', () => {
      const payload = {
        type: 'task',
        id: 'task-101',
        title: 'Soạn giáo án Ngữ văn 10',
        body: 'Bắt đầu lúc 08:30 sáng mai',
        url: '/tasks?date=2026-10-27',
        targetDate: '2026-10-27',
        icon: '/custom/icon.png',
        badge: '/custom/badge.png',
      };

      const result = formatPushNotification(payload);

      expect(result).toEqual({
        title: 'Soạn giáo án Ngữ văn 10',
        body: 'Bắt đầu lúc 08:30 sáng mai',
        url: '/tasks?date=2026-10-27',
        tag: 'reminder-task-task-101',
        icon: '/custom/icon.png',
        badge: '/custom/badge.png',
        data: {
          ...payload,
          url: '/tasks?date=2026-10-27',
          id: 'task-101',
          type: 'task',
          targetDate: '2026-10-27',
        },
      });
    });

    it('formats a complete class session reminder payload correctly', () => {
      const payload = {
        type: 'class_session',
        id: 'session-202',
        title: 'Toán 10A1 (Tiết 1)',
        body: '07:30 tại Phòng học 204',
        url: '/timetable?date=2026-10-27',
        targetDate: '2026-10-27',
      };

      const result = formatPushNotification(payload);

      expect(result).toEqual({
        title: 'Toán 10A1 (Tiết 1)',
        body: '07:30 tại Phòng học 204',
        url: '/timetable?date=2026-10-27',
        tag: 'reminder-class-session-session-202',
        icon: DEFAULT_NOTIFICATION_ICON,
        badge: DEFAULT_NOTIFICATION_BADGE,
        data: {
          ...payload,
          url: '/timetable?date=2026-10-27',
          id: 'session-202',
          type: 'class_session',
          targetDate: '2026-10-27',
        },
      });
    });

    it('re-exports formatNotification alias identically to formatPushNotification', () => {
      expect(formatNotification).toBe(formatPushNotification);
    });
  });

  describe('Tag generation and anti-spam identifiers', () => {
    it('generates tag for task reminder using id', () => {
      const result = formatPushNotification({
        type: 'task',
        id: 'abc-456',
      });
      expect(result.tag).toBe('reminder-task-abc-456');
    });

    it('generates tag for class session reminder using id', () => {
      const result = formatPushNotification({
        type: 'class_session',
        id: 'xyz-789',
      });
      expect(result.tag).toBe('reminder-class-session-xyz-789');
    });

    it('generates tag with sanitized type when custom type is given', () => {
      const result = formatPushNotification({
        type: 'exam_session',
        id: 'ex-1',
      });
      expect(result.tag).toBe('reminder-exam-session-ex-1');
    });

    it('generates tag with id only if type is missing', () => {
      const result = formatPushNotification({
        id: 'item-99',
      });
      expect(result.tag).toBe('reminder-item-99');
    });

    it('preserves explicit tag if id is absent', () => {
      const result = formatPushNotification({
        tag: 'custom-unique-tag',
      });
      expect(result.tag).toBe('custom-unique-tag');
    });

    it('falls back to reminder-general if neither id nor tag is given', () => {
      const result = formatPushNotification({});
      expect(result.tag).toBe('reminder-general');
    });
  });

  describe('URL navigation to target date', () => {
    it('uses explicit url when provided', () => {
      const result = formatPushNotification({
        url: '/calendar?date=2026-10-27#session-1',
      });
      expect(result.url).toBe('/calendar?date=2026-10-27#session-1');
      expect(result.data.url).toBe('/calendar?date=2026-10-27#session-1');
    });

    it('constructs /tasks?date=YYYY-MM-DD for task when url is omitted but targetDate is provided', () => {
      const result = formatPushNotification({
        type: 'task',
        id: 'task-1',
        targetDate: '2026-10-27',
      });
      expect(result.url).toBe('/tasks?date=2026-10-27');
      expect(result.data.url).toBe('/tasks?date=2026-10-27');
    });

    it('constructs /timetable?date=YYYY-MM-DD for class_session when url is omitted but targetDate is provided', () => {
      const result = formatPushNotification({
        type: 'class_session',
        id: 'cs-1',
        targetDate: '2026-10-27',
      });
      expect(result.url).toBe('/timetable?date=2026-10-27');
      expect(result.data.url).toBe('/timetable?date=2026-10-27');
    });

    it('supports date field as alias for targetDate', () => {
      const result = formatPushNotification({
        type: 'task',
        id: 'task-1',
        date: '2026-10-28',
      });
      expect(result.url).toBe('/tasks?date=2026-10-28');
    });

    it('constructs /?date=YYYY-MM-DD when type is unknown but targetDate is provided', () => {
      const result = formatPushNotification({
        targetDate: '2026-10-27',
      });
      expect(result.url).toBe('/?date=2026-10-27');
    });

    it('falls back to /tasks when type is task without date or url', () => {
      const result = formatPushNotification({
        type: 'task',
        id: 'task-1',
      });
      expect(result.url).toBe('/tasks');
    });

    it('falls back to /timetable when type is class_session without date or url', () => {
      const result = formatPushNotification({
        type: 'class_session',
        id: 'cs-1',
      });
      expect(result.url).toBe('/timetable');
    });

    it('falls back to / when everything is missing', () => {
      const result = formatPushNotification({});
      expect(result.url).toBe('/');
      expect(result.data.url).toBe('/');
    });
  });

  describe('Missing fields and safe fallbacks', () => {
    it('provides safe Vietnamese defaults when title, body, and url are missing', () => {
      const result = formatPushNotification({
        type: 'task',
        id: 'task-1',
      });
      expect(result.title).toBe('Nhắc nhở công việc');
      expect(result.body).toBe('Bạn có một việc cần làm sắp đến giờ.');
      expect(result.icon).toBe(DEFAULT_NOTIFICATION_ICON);
      expect(result.badge).toBe(DEFAULT_NOTIFICATION_BADGE);
    });

    it('provides safe Vietnamese defaults for class_session when title and body are missing', () => {
      const result = formatPushNotification({
        type: 'class_session',
        id: 'cs-1',
      });
      expect(result.title).toBe('Nhắc nhở tiết dạy');
      expect(result.body).toBe('Bạn có một tiết dạy sắp bắt đầu.');
    });

    it('provides English fallback when locale is en', () => {
      const taskResult = formatPushNotification({
        type: 'task',
        id: 'task-1',
        locale: 'en',
      });
      expect(taskResult.title).toBe('Task Reminder');
      expect(taskResult.body).toBe('You have an upcoming task.');

      const sessionResult = formatPushNotification({
        type: 'class_session',
        id: 'cs-1',
        locale: 'en',
      });
      expect(sessionResult.title).toBe('Class Session Reminder');
      expect(sessionResult.body).toBe('You have an upcoming class session.');

      const genericResult = formatPushNotification({
        locale: 'en',
      });
      expect(genericResult.title).toBe('CuteTeachy');
      expect(genericResult.body).toBe('You have a new reminder from CuteTeachy.');
    });

    it('handles empty payload gracefully', () => {
      const result = formatPushNotification({});
      expect(result.title).toBe('CuteTeachy');
      expect(result.body).toBe('Bạn có thông báo mới từ CuteTeachy.');
      expect(result.url).toBe('/');
      expect(result.tag).toBe('reminder-general');
    });

    it('handles null and undefined payload gracefully', () => {
      const fromNull = formatPushNotification(null);
      expect(fromNull.title).toBe('CuteTeachy');
      expect(fromNull.url).toBe('/');

      const fromUndefined = formatPushNotification(undefined);
      expect(fromUndefined.title).toBe('CuteTeachy');
      expect(fromUndefined.url).toBe('/');
    });

    it('handles primitive payloads (numbers, booleans, arrays) without throwing', () => {
      expect(() => formatPushNotification(12345)).not.toThrow();
      expect(() => formatPushNotification(true)).not.toThrow();
      expect(() => formatPushNotification(['array', 'item'])).not.toThrow();

      const result = formatPushNotification(['array', 'item']);
      expect(result.title).toBe('CuteTeachy');
      expect(result.url).toBe('/');
    });
  });

  describe('JSON string parsing & malformed handling', () => {
    it('parses valid JSON string payload correctly', () => {
      const rawJson = JSON.stringify({
        type: 'task',
        id: 'json-123',
        title: 'Chuẩn bị đề thi',
        body: 'Trước 14:00',
        url: '/tasks?date=2026-10-30',
      });

      const result = formatPushNotification(rawJson);
      expect(result.title).toBe('Chuẩn bị đề thi');
      expect(result.body).toBe('Trước 14:00');
      expect(result.url).toBe('/tasks?date=2026-10-30');
      expect(result.tag).toBe('reminder-task-json-123');
      expect(result.data.id).toBe('json-123');
    });

    it('safely handles broken/malformed JSON string without throwing unhandled error', () => {
      const malformedJson = '{"type": "task", id: BROKEN_JSON';

      expect(() => formatPushNotification(malformedJson)).not.toThrow();
      const result = formatPushNotification(malformedJson);
      expect(result.title).toBe('CuteTeachy');
      expect(result.body).toBe('Bạn có thông báo mới từ CuteTeachy.');
      expect(result.url).toBe('/');
      expect(result.tag).toBe('reminder-general');
    });

    it('safely handles empty string or whitespace string', () => {
      const result = formatPushNotification('   ');
      expect(result.title).toBe('CuteTeachy');
      expect(result.url).toBe('/');
      expect(result.tag).toBe('reminder-general');
    });
  });

  describe('Pure helper functions', () => {
    it('computeReminderTag works as expected across edge cases', () => {
      expect(computeReminderTag('task', '10')).toBe('reminder-task-10');
      expect(computeReminderTag('class_session', '20')).toBe('reminder-class-session-20');
      expect(computeReminderTag('', '30')).toBe('reminder-30');
      expect(computeReminderTag(undefined, undefined, 'explicit-tag')).toBe('explicit-tag');
      expect(computeReminderTag(undefined, undefined, undefined)).toBe('reminder-general');
    });

    it('computeReminderUrl works as expected across edge cases', () => {
      expect(computeReminderUrl('https://example.com')).toBe('https://example.com');
      expect(computeReminderUrl(undefined, 'task', '2026-10-27')).toBe('/tasks?date=2026-10-27');
      expect(computeReminderUrl(undefined, 'class_session', '2026-10-27')).toBe(
        '/timetable?date=2026-10-27',
      );
      expect(computeReminderUrl(undefined, undefined, '2026-10-27')).toBe('/?date=2026-10-27');
      expect(computeReminderUrl(undefined, 'task', undefined)).toBe('/tasks');
      expect(computeReminderUrl(undefined, 'class_session', undefined)).toBe('/timetable');
      expect(computeReminderUrl(undefined, undefined, undefined)).toBe('/');
    });

    it('computeReminderTitle respects custom title and falls back', () => {
      expect(computeReminderTitle('Custom Title')).toBe('Custom Title');
      expect(computeReminderTitle('', 'task', 'vi')).toBe('Nhắc nhở công việc');
      expect(computeReminderTitle('', 'class_session', 'vi')).toBe('Nhắc nhở tiết dạy');
      expect(computeReminderTitle('', 'task', 'en')).toBe('Task Reminder');
      expect(computeReminderTitle('', 'class_session', 'en')).toBe('Class Session Reminder');
      expect(computeReminderTitle('', undefined, 'en')).toBe('CuteTeachy');
    });

    it('computeReminderBody respects custom body and falls back', () => {
      expect(computeReminderBody('Custom Body')).toBe('Custom Body');
      expect(computeReminderBody('', 'task', 'vi')).toBe('Bạn có một việc cần làm sắp đến giờ.');
      expect(computeReminderBody('', 'class_session', 'vi')).toBe(
        'Bạn có một tiết dạy sắp bắt đầu.',
      );
      expect(computeReminderBody('', 'task', 'en')).toBe('You have an upcoming task.');
      expect(computeReminderBody('', 'class_session', 'en')).toBe(
        'You have an upcoming class session.',
      );
      expect(computeReminderBody('', undefined, 'en')).toBe('You have a new reminder from CuteTeachy.');
    });
  });
});
