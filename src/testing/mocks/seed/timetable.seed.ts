import type { ClassSession, TimetableSlot } from '@/types';
import type { SessionOverride } from '@/utils';
import type { SeedContext } from './seed-context';

export const seedTimetableSlots = (): TimetableSlot[] => [
  // Thứ Hai (weekday 1)
  {
    id: 'slot-mon-1',
    weekday: 1,
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Sinh học',
    grade: 'Lớp 10',
    room: 'Phòng 302',
    tone: 'blue',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'slot-mon-2',
    weekday: 1,
    startTime: '11:00',
    endTime: '12:30',
    subject: 'Hóa học',
    grade: 'Lớp 12',
    room: 'Phòng thí nghiệm 1',
    tone: 'beige',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },

  // Thứ Ba (weekday 2)
  {
    id: 'slot-tue-1',
    weekday: 2,
    startTime: '11:00',
    endTime: '12:30',
    subject: 'Hóa học',
    grade: 'Lớp 12',
    room: 'Phòng thí nghiệm 1',
    tone: 'beige',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'slot-tue-2',
    weekday: 2,
    startTime: '14:00',
    endTime: '15:00',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 4',
    room: 'Phòng 105',
    tone: 'pink',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },

  // Thứ Tư (weekday 3)
  {
    id: 'slot-wed-1',
    weekday: 3,
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Sinh học',
    grade: 'Lớp 10',
    room: null, // Test room optional / empty handling
    tone: 'blue',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'slot-wed-2',
    weekday: 3,
    startTime: '14:00',
    endTime: '15:00',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 4',
    room: 'Phòng 105',
    tone: 'pink',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },

  // Thứ Năm (weekday 4)
  {
    id: 'slot-thu-1',
    weekday: 4,
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Sinh học',
    grade: 'Lớp 10',
    room: 'Phòng 302',
    tone: 'blue',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'slot-thu-2',
    weekday: 4,
    startTime: '11:00',
    endTime: '12:30',
    subject: 'Hóa học',
    grade: 'Lớp 12',
    room: 'Phòng thí nghiệm 1',
    tone: 'beige',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },

  // Thứ Sáu (weekday 5)
  {
    id: 'slot-fri-1',
    weekday: 5,
    startTime: '11:00',
    endTime: '12:30',
    subject: 'Hóa học',
    grade: 'Lớp 12',
    room: 'Phòng thí nghiệm 1',
    tone: 'beige',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'slot-fri-2',
    weekday: 5,
    startTime: '14:00',
    endTime: '15:00',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 4',
    room: 'Phòng 105',
    tone: 'pink',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

export const seedSessionOverrides = ({ weekday }: SeedContext): SessionOverride[] => [
  {
    timetableSlotId: 'slot-mon-1',
    date: weekday(0), // Monday
    topic: 'Hô hấp tế bào – quá trình tạo ATP',
    prepItems: [{ id: 'prep-mon-1-0', label: 'In phiếu bài tập', done: false }],
    cancelled: false,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    timetableSlotId: 'slot-mon-2',
    date: weekday(0), // Monday
    topic: 'Nhiệt động lực học & thí nghiệm entanpi',
    prepItems: [
      { id: 'prep-mon-2-0', label: 'Chuẩn bị bàn thí nghiệm', done: false },
      { id: 'prep-mon-2-1', label: 'Ôn quy tắc an toàn', done: false },
    ],
    cancelled: false,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    timetableSlotId: 'slot-tue-2',
    date: weekday(1), // Tuesday
    topic: 'Giới thiệu hệ sinh thái',
    prepItems: [],
    cancelled: false,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    timetableSlotId: 'slot-wed-1',
    date: weekday(2), // Wednesday (no room, cancelled)
    topic: 'Di truyền học phân tử (Tạm huỷ do họp bộ môn)',
    prepItems: [],
    cancelled: true,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    timetableSlotId: 'slot-thu-1',
    date: weekday(3), // Thursday
    topic: 'Cấu trúc ADN & ARN',
    prepItems: [{ id: 'prep-thu-1-0', label: 'Chiếu video mô hình 3D', done: false }],
    cancelled: false,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];

export const seedAdhocSessions = ({ weekday }: SeedContext): ClassSession[] => [
  {
    id: 'adhoc-sat-1',
    timetableSlotId: null,
    subject: 'Bồi dưỡng học sinh giỏi Hóa',
    grade: 'Lớp 12',
    room: 'Phòng thí nghiệm 1',
    date: weekday(5), // Saturday
    startTime: '08:30',
    endTime: '10:00',
    tone: 'rose',
    topic: 'Dạy bù chuyên đề phản ứng oxi hóa khử nâng cao',
    prepItems: [{ id: 'prep-adhoc-1', label: 'Chuẩn bị hóa chất chuẩn độ', done: false }],
    cancelled: false,
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];
