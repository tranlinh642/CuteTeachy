import type { Tone } from '@/lib/theme';

export interface ToneClassSet {
  /** Nền pastel (chip, thẻ). */
  readonly bg: string;
  /** Màu chữ đạt tương phản AA trên nền pastel. */
  readonly fg: string;
  /** Màu nhấn đậm (thanh màu, chấm lịch). */
  readonly accent: string;
  /** Viền dùng cho trạng thái chọn. */
  readonly ring: string;
}

/** Class Tailwind tĩnh cho từng tone – viết đầy đủ để Tailwind quét được. */
export const toneClasses: Readonly<Record<Tone, ToneClassSet>> = {
  pink: { bg: 'bg-tone-pink', fg: 'text-tone-pink-fg', accent: 'bg-tone-pink-accent', ring: 'ring-tone-pink-accent' },
  blue: { bg: 'bg-tone-blue', fg: 'text-tone-blue-fg', accent: 'bg-tone-blue-accent', ring: 'ring-tone-blue-accent' },
  beige: {
    bg: 'bg-tone-beige',
    fg: 'text-tone-beige-fg',
    accent: 'bg-tone-beige-accent',
    ring: 'ring-tone-beige-accent',
  },
  lavender: {
    bg: 'bg-tone-lavender',
    fg: 'text-tone-lavender-fg',
    accent: 'bg-tone-lavender-accent',
    ring: 'ring-tone-lavender-accent',
  },
  mint: { bg: 'bg-tone-mint', fg: 'text-tone-mint-fg', accent: 'bg-tone-mint-accent', ring: 'ring-tone-mint-accent' },
  rose: { bg: 'bg-tone-rose', fg: 'text-tone-rose-fg', accent: 'bg-tone-rose-accent', ring: 'ring-tone-rose-accent' },
};
