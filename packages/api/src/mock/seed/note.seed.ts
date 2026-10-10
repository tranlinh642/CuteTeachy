import type { Note } from '@cute-teachy/types';
import type { SeedContext } from './seed-context';

export const seedNotes = ({ day, now }: SeedContext): Note[] => {
  const base = { createdAt: now, updatedAt: now, checklist: [], tagIds: [], completed: false };
  return [
    {
      ...base,
      id: 'note-1',
      title: 'Chuẩn bị dụng cụ thí nghiệm',
      content: 'Lấy cốc thủy tinh, phẩm màu và phiếu bài tập cho tiết thí nghiệm chiều nay. Nhớ kiểm tra kính bảo hộ!',
      tagIds: ['tag-science', 'tag-prep'],
      dueDate: day(1),
    },
    {
      ...base,
      id: 'note-2',
      title: 'Ôn tập bài tập Toán',
      tagIds: ['tag-grading'],
      checklist: [
        { id: 'c-1', text: 'Chấm phần A: Phân số', done: true },
        { id: 'c-2', text: 'Chấm phần B: Bài toán có lời văn', done: false },
        { id: 'c-3', text: 'Nhập điểm vào hệ thống', done: false },
        { id: 'c-4', text: 'Đánh dấu học sinh cần hỗ trợ', done: false },
      ],
    },
    {
      ...base,
      id: 'note-3',
      title: 'Ý tưởng dự án Mỹ thuật mùa xuân',
      content: 'Dùng vật liệu tái chế cho Ngày Trái Đất. Có thể làm tranh ghép từ nắp chai hoặc quả địa cầu bằng giấy bồi?',
      tagIds: ['tag-ideas'],
    },
    {
      ...base,
      id: 'note-4',
      title: 'Họp phụ huynh – bé An',
      content: '“An gần đây đọc ở nhà nhiều hơn nhưng vẫn gặp khó với câu hỏi đọc hiểu.” Gửi sơ đồ tư duy cho bài đọc về nhà. Hẹn trao đổi lại thứ Ba tới.',
      tagIds: ['tag-meeting'],
    },
    {
      ...base,
      id: 'note-5',
      title: 'Cập nhật bảng tin lớp',
      content: 'Đổi chủ đề sang “Mùa xuân tươi mới”. Cần giấy màu pastel và tranh vẽ mới của các con.',
      tagIds: ['tag-admin'],
      completed: true,
    },
  ];
};
