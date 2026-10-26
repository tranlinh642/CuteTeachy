import type { Tag } from '@/types';

export const seedTags = (): Tag[] => [
  { id: 'tag-science', name: 'Khoa học', tone: 'blue', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-prep', name: 'Chuẩn bị', tone: 'pink', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-urgent', name: 'Khẩn cấp', tone: 'rose', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-admin', name: 'Hành chính', tone: 'beige', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-grading', name: 'Chấm bài', tone: 'mint', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-meeting', name: 'Họp', tone: 'lavender', updatedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'tag-ideas', name: 'Ý tưởng', tone: 'beige', updatedAt: '2026-10-01T00:00:00.000Z' },
];
