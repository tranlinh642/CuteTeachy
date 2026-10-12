import type { Tag } from '@/types';

export const seedTags = (): Tag[] => [
  { id: 'tag-science', name: 'Khoa học', tone: 'blue' },
  { id: 'tag-prep', name: 'Chuẩn bị', tone: 'pink' },
  { id: 'tag-urgent', name: 'Khẩn cấp', tone: 'rose' },
  { id: 'tag-admin', name: 'Hành chính', tone: 'beige' },
  { id: 'tag-grading', name: 'Chấm bài', tone: 'mint' },
  { id: 'tag-meeting', name: 'Họp', tone: 'lavender' },
  { id: 'tag-ideas', name: 'Ý tưởng', tone: 'beige' },
];
