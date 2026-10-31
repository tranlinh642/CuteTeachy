import type { InAppNotification } from '@/types';
import type { SeedContext } from './seed-context';

export const seedNotifications = ({ day, today }: SeedContext): InAppNotification[] => {
  const tenMinAgo = new Date(today.getTime() - 10 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000).toISOString();
  const yesterdayIso = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'notif-1',
      accountId: 'u-1',
      type: 'class_session',
      targetId: 'cs-1',
      title: 'Tiết dạy: Toán 5A',
      body: 'Bắt đầu lúc 08:00 tại Phòng 201',
      url: `/timetable?date=${day(0)}`,
      data: { type: 'class_session', id: 'cs-1', date: day(0) },
      readAt: null,
      createdAt: tenMinAgo,
    },
    {
      id: 'notif-2',
      accountId: 'u-1',
      type: 'note',
      targetId: 'note-1',
      title: 'Nhắc nhở ghi chú: Chuẩn bị dụng cụ thí nghiệm',
      body: '13:30',
      url: '/notes?noteId=note-1',
      data: { type: 'note', id: 'note-1', date: day(1) },
      readAt: null,
      createdAt: oneHourAgo,
    },
    {
      id: 'notif-3',
      accountId: 'u-1',
      type: 'task',
      targetId: 'task-1',
      title: 'Nhắc nhở công việc: Chấm bài kiểm tra',
      body: '16:00',
      url: `/calendar?date=${day(-1)}`,
      data: { type: 'task', id: 'task-1', date: day(-1) },
      readAt: yesterdayIso,
      createdAt: yesterdayIso,
    },
  ];
};
