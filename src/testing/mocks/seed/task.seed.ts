import type { Task } from '@/types';
import type { SeedContext } from './seed-context';

export const seedTasks = ({ day, now }: SeedContext): Task[] => {
  const base = { createdAt: now, updatedAt: now, priority: 'normal' as const, tagIds: [] as string[] };
  return [
    { ...base, id: 'task-1', title: 'Chấm bài kiểm tra Sinh học', notes: 'Hạn sáng mai', date: day(0), time: '17:00', category: 'school', priority: 'high', tagIds: ['tag-grading'], completed: false },
    { ...base, id: 'task-2', title: 'Gửi giấy xin phép đi dã ngoại', date: day(0), category: 'school', completed: true },
    { ...base, id: 'task-3', title: 'Soạn đề cương học kỳ', notes: 'Tập trung phần thực hành', date: day(0), category: 'school', tagIds: ['tag-prep'], completed: false },
    { ...base, id: 'task-4', title: 'Tưới cây trong lớp', date: day(0), category: 'personal', completed: false },
    { ...base, id: 'task-5', title: 'Xem lại bài giữa kỳ', notes: 'Trước 17h', date: day(0), time: '17:00', category: 'personal', completed: false },
    { ...base, id: 'task-6', title: 'Gọi điện cho mẹ', notes: 'Giờ nghỉ trưa', date: day(0), time: '12:00', category: 'personal', completed: false },
    { ...base, id: 'task-7', title: 'Họp tổ chuyên môn', date: day(1), time: '14:30', category: 'school', tagIds: ['tag-meeting'], completed: false },
    { ...base, id: 'task-8', title: 'Mua giấy màu trang trí bảng tin', date: day(2), category: 'personal', completed: false },
    { ...base, id: 'task-9', title: 'Nộp báo cáo tháng', date: day(5), time: '09:00', category: 'school', tagIds: ['tag-admin'], completed: false },
  ];
};
