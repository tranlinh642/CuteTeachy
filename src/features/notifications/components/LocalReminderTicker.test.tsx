import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { ServicesContext } from '@/lib/api/services-context';
import { queryKeys } from '@/lib/query';
import type { Services } from '@/lib/api';
import type { ClassSession, Note, Settings, Task } from '@/types';
import {
  buildReminderTag,
  computeClassSessionRemindAt,
  computeNoteRemindAt,
  computeTaskRemindAt,
  evaluateDueReminders,
  playReminderChime,
  runReminderTick,
} from '../utils/local-reminder-ticker';
import { LocalReminderTicker } from './LocalReminderTicker';

const routerPushSpy = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}));

describe('LocalReminderTicker & Reminder Calculation (SPEC-006 S6-FE-02)', () => {
  const timeZone = 'Asia/Ho_Chi_Minh'; // UTC+7
  const leadMinutes = 15;

  let mockStorage: Map<string, string>;
  let storageAdapter: Pick<Storage, 'getItem' | 'setItem'>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = new Map<string, string>();
    storageAdapter = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mockStorage.set(key, value);
      },
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('computeRemindAt rules', () => {
    it('calculates Task remindAt as (date + time) - reminderLeadMinutes in teacher timeZone', () => {
      const task: Task = {
        id: 't-1',
        title: 'Nộp giáo án',
        date: '2026-10-29',
        time: '08:00',
        category: 'school',
        priority: 'high',
        tagIds: [],
        completed: false,
        createdAt: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
      };

      const remindAt = computeTaskRemindAt(task, leadMinutes, timeZone);
      // 2026-10-29 08:00 ICT (UTC+7) = 01:00 UTC. Minus 15m = 00:45 UTC
      expect(remindAt?.toISOString()).toBe('2026-10-29T00:45:00.000Z');
    });

    it('returns null for completed or timeless Task', () => {
      expect(
        computeTaskRemindAt(
          { date: '2026-10-29', time: '08:00', completed: true },
          leadMinutes,
          timeZone,
        ),
      ).toBeNull();
      expect(
        computeTaskRemindAt(
          { date: '2026-10-29', time: undefined, completed: false },
          leadMinutes,
          timeZone,
        ),
      ).toBeNull();
    });

    it('calculates ClassSession remindAt as (date + startTime) - reminderLeadMinutes and skips cancelled sessions', () => {
      const session: ClassSession = {
        id: 'cs-1',
        timetableSlotId: 'slot-1',
        subject: 'Toán',
        grade: '5A',
        room: '201',
        date: '2026-10-29',
        startTime: '09:30',
        endTime: '10:15',
        prepItems: [],
        tone: 'blue',
        cancelled: false,
        updatedAt: '2026-10-28T00:00:00Z',
      };

      // 09:30 ICT - 15m = 09:15 ICT = 02:15 UTC
      expect(computeClassSessionRemindAt(session, leadMinutes, timeZone)?.toISOString()).toBe(
        '2026-10-29T02:15:00.000Z',
      );
      expect(
        computeClassSessionRemindAt({ ...session, cancelled: true }, leadMinutes, timeZone),
      ).toBeNull();
    });

    it('calculates Note remindAt: uses dueDate + remindTime - leadMinutes when remindTime is set, or dueDate + 07:00 when remindTime is empty', () => {
      const timedNote: Note = {
        id: 'n-1',
        title: 'Họp phụ huynh',
        checklist: [],
        tagIds: [],
        dueDate: '2026-10-29',
        remindTime: '14:00',
        completed: false,
        createdAt: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
      };
      // 14:00 ICT - 15m = 13:45 ICT = 06:45 UTC
      expect(computeNoteRemindAt(timedNote, leadMinutes, timeZone)?.toISOString()).toBe(
        '2026-10-29T06:45:00.000Z',
      );

      const dateOnlyNote: Note = {
        ...timedNote,
        id: 'n-2',
        remindTime: null,
      };
      // 07:00 ICT fixed = 00:00 UTC
      expect(computeNoteRemindAt(dateOnlyNote, leadMinutes, timeZone)?.toISOString()).toBe(
        '2026-10-29T00:00:00.000Z',
      );

      expect(
        computeNoteRemindAt({ ...timedNote, completed: true }, leadMinutes, timeZone),
      ).toBeNull();
    });
  });

  describe('Window detection, localStorage idempotency & Service Worker showNotification', () => {
    const sampleTask: Task = {
      id: 'task-10',
      title: 'Chấm bài tập',
      date: '2026-10-29',
      time: '08:00', // remindAt = 07:45 ICT = 2026-10-29T00:45:00.000Z
      category: 'school',
      priority: 'normal',
      tagIds: [],
      completed: false,
      createdAt: '2026-10-28T00:00:00Z',
      updatedAt: '2026-10-28T00:00:00Z',
    };

    const sampleSession: ClassSession = {
      id: 'cs-20',
      timetableSlotId: 'slot-1',
      subject: 'Khoa học',
      grade: '5B',
      room: 'Lab 1',
      date: '2026-10-29',
      startTime: '08:00', // remindAt = 07:45 ICT = 2026-10-29T00:45:00.000Z
      endTime: '08:45',
      prepItems: [],
      tone: 'mint',
      cancelled: false,
      updatedAt: '2026-10-28T00:00:00Z',
    };

    const sampleNote: Note = {
      id: 'note-30',
      title: 'Dặn học sinh nộp sổ',
      checklist: [],
      tagIds: [],
      dueDate: '2026-10-29',
      remindTime: '08:00', // remindAt = 07:45 ICT = 2026-10-29T00:45:00.000Z
      completed: false,
      createdAt: '2026-10-28T00:00:00Z',
      updatedAt: '2026-10-28T00:00:00Z',
    };

    it('detects due Task, ClassSession, and Note in [(now - 2 min), now] and skips already-fired tags in localStorage', () => {
      // 30 seconds after remindAt (within 2-minute window)
      const now = new Date('2026-10-29T00:45:30.000Z');
      const remindAtMs = new Date('2026-10-29T00:45:00.000Z').getTime();

      const firstRun = evaluateDueReminders({
        tasks: [sampleTask],
        classSessions: [sampleSession],
        notes: [sampleNote],
        leadMinutes,
        timeZone,
        locale: 'vi',
        now,
        storage: storageAdapter,
      });

      expect(firstRun).toHaveLength(3);
      expect(firstRun.map((i) => i.tag)).toEqual([
        buildReminderTag('task', 'task-10', remindAtMs),
        buildReminderTag('class_session', 'cs-20', remindAtMs),
        buildReminderTag('note', 'note-30', remindAtMs),
      ]);
      expect(firstRun[0].url).toBe('/calendar?date=2026-10-29');
      expect(firstRun[1].url).toBe('/timetable?date=2026-10-29');
      expect(firstRun[2].url).toBe('/notes?noteId=note-30');

      // Second tick 15s later within the same 2-minute window must NOT fire again
      const secondRun = evaluateDueReminders({
        tasks: [sampleTask],
        classSessions: [sampleSession],
        notes: [sampleNote],
        leadMinutes,
        timeZone,
        locale: 'vi',
        now: new Date('2026-10-29T00:45:45.000Z'),
        storage: storageAdapter,
      });

      expect(secondRun).toHaveLength(0);
    });

    it('invalidates notifications query, plays gentle chime, and triggers Service Worker showNotification with matching tag when tab is hidden and permission is granted', async () => {
      const now = new Date('2026-10-29T00:45:10.000Z');
      const remindAtMs = new Date('2026-10-29T00:45:00.000Z').getTime();
      const invalidateSpy = vi.fn().mockResolvedValue(undefined);
      const playChimeSpy = vi.fn();
      const showNotificationSpy = vi.fn().mockResolvedValue(undefined);

      const newlyDue = await runReminderTick({
        tasks: [sampleTask],
        classSessions: [],
        notes: [],
        leadMinutes,
        timeZone,
        locale: 'vi',
        now,
        storage: storageAdapter,
        invalidateNotifications: invalidateSpy,
        playChime: playChimeSpy,
        notificationPermission: 'granted',
        visibilityState: 'hidden',
        serviceWorkerReady: Promise.resolve({
          showNotification: showNotificationSpy,
        } as unknown as ServiceWorkerRegistration),
      });

      expect(newlyDue).toHaveLength(1);
      expect(playChimeSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledTimes(1);
      expect(showNotificationSpy).toHaveBeenCalledWith(
        'Nhắc nhở công việc: Chấm bài tập',
        expect.objectContaining({
          body: '08:00',
          tag: `task-task-10-${remindAtMs}`,
          data: expect.objectContaining({
            url: '/calendar?date=2026-10-29',
            type: 'task',
            id: 'task-10',
          }),
        }),
      );
    });

    it('plays gentle chime via Web Audio API safely in playReminderChime without throwing (SPEC-006 line 20)', () => {
      const startSpy = vi.fn();
      const stopSpy = vi.fn();
      const connectSpy = vi.fn();

      class MockAudioContext {
        currentTime = 0;
        destination = {};
        createOscillator() {
          return {
            type: 'sine',
            frequency: { setValueAtTime: vi.fn() },
            connect: connectSpy,
            start: startSpy,
            stop: stopSpy,
            onended: null,
          };
        }
        createGain() {
          return {
            gain: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: connectSpy,
          };
        }
        close = vi.fn().mockResolvedValue(undefined);
      }

      vi.stubGlobal('window', {
        AudioContext: MockAudioContext,
      });

      expect(() => playReminderChime()).not.toThrow();
      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('LocalReminderTicker Toast Banner rendering', () => {
    it('renders floating toast banner with navigation action for due reminders', () => {
      const queryClient = new QueryClient();
      const mockServices = {
        tasks: { list: vi.fn().mockResolvedValue({ items: [], deletedIds: [], serverTime: '' }) },
        classSessions: {
          list: vi.fn().mockResolvedValue({ items: [], deletedIds: [], serverTime: '' }),
        },
        notes: { list: vi.fn().mockResolvedValue({ items: [], deletedIds: [], serverTime: '' }) },
        settings: {
          get: vi.fn().mockResolvedValue({
            locale: 'vi',
            timeZone: 'Asia/Ho_Chi_Minh',
            pushEnabled: true,
            reminderLeadMinutes: 15,
          } satisfies Settings),
        },
      } as unknown as Services;

      queryClient.setQueryData(queryKeys.settings.all, {
        locale: 'vi',
        timeZone: 'Asia/Ho_Chi_Minh',
        pushEnabled: true,
        reminderLeadMinutes: 15,
      } satisfies Settings);

      const html = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <ServicesContext.Provider value={mockServices}>
            <I18nProvider defaultLocale="vi">
              <LocalReminderTicker
                isAuthenticatedOverride={true}
                initialToasts={[
                  {
                    tag: 'note-note-1-1761698700000',
                    type: 'note',
                    targetId: 'note-1',
                    remindAtMs: 1761698700000,
                    title: 'Nhắc nhở ghi chú: Chuẩn bị dụng cụ thí nghiệm',
                    body: '13:30',
                    url: '/notes?noteId=note-1',
                  },
                ]}
              />
            </I18nProvider>
          </ServicesContext.Provider>
        </QueryClientProvider>,
      );

      expect(html).toContain('data-testid="local-reminder-toast-container"');
      expect(html).toContain('Nhắc nhở ghi chú: Chuẩn bị dụng cụ thí nghiệm');
      expect(html).toContain('13:30');
      expect(html).toContain('Xem chi tiết');
    });
  });
});
