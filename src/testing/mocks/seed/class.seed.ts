import type { ClassSession, Tone } from '@/types';
import type { SeedContext } from './seed-context';

interface ClassTemplate {
  readonly subject: string;
  readonly grade: string;
  readonly room: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly topic: string;
  readonly tone: Tone;
  readonly prep?: readonly string[];
}

const TEMPLATES: readonly ClassTemplate[] = [
  { subject: 'Sinh học', grade: 'Lớp 10', room: 'Phòng 302', startTime: '09:00', endTime: '10:30', topic: 'Hô hấp tế bào – quá trình tạo ATP', tone: 'blue', prep: ['In phiếu bài tập'] },
  { subject: 'Hóa học', grade: 'Lớp 12', room: 'Phòng thí nghiệm 1', startTime: '11:00', endTime: '12:30', topic: 'Nhiệt động lực học & thí nghiệm entanpi', tone: 'beige', prep: ['Chuẩn bị bàn thí nghiệm', 'Ôn quy tắc an toàn'] },
  { subject: 'Khoa học tự nhiên', grade: 'Lớp 4', room: 'Phòng 105', startTime: '14:00', endTime: '15:00', topic: 'Giới thiệu hệ sinh thái', tone: 'pink' },
];

/** Two classes per school day (Mon–Fri) of the current week. */
export const seedClasses = ({ weekday }: SeedContext): ClassSession[] =>
  Array.from({ length: 5 }, (_, dayIndex) => dayIndex).flatMap((dayIndex) =>
    [TEMPLATES[dayIndex % TEMPLATES.length], TEMPLATES[(dayIndex + 1) % TEMPLATES.length]].flatMap(
      (template, slot) =>
        template
          ? [
              {
                id: `class-${dayIndex}-${slot}`,
                subject: template.subject,
                grade: template.grade,
                room: template.room,
                date: weekday(dayIndex),
                startTime: template.startTime,
                endTime: template.endTime,
                topic: template.topic,
                tone: template.tone,
                prepItems: (template.prep ?? []).map((label, index) => ({
                  id: `prep-${dayIndex}-${slot}-${index}`,
                  label,
                  done: false,
                })),
              },
            ]
          : [],
    ),
  );
