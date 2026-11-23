import type { AiChatMessage } from '@/types';
import type { SeedContext } from './seed-context';

export const seedAiMessages = ({ today }: SeedContext): AiChatMessage[] => {
  const fiveMinAgo = new Date(today.getTime() - 5 * 60 * 1000).toISOString();

  return [
    {
      id: 'ai-msg-seed-1',
      accountId: 'u-1',
      role: 'assistant',
      content:
        'Xin chào! Tôi là Trợ lý AI của CuteTeachy. Bạn có thể gửi ảnh chụp Thời khóa biểu hoặc nhắn tin để thêm lịch dạy, lịch dạy thêm, lịch học cá nhân, hoặc hỏi tôi về lịch trình trong ngày/tuần.',
      imageUrl: null,
      imageExpiresAt: null,
      draft: null,
      createdAt: fiveMinAgo,
    },
  ];
};
