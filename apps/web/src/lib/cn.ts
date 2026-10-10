import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge cần biết các cỡ chữ của design system (`text-body-lg`…),
 * nếu không nó sẽ coi chúng là màu chữ và xoá nhầm `text-on-surface`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-lg',
            'display-md',
            'headline-md',
            'title-lg',
            'title-md',
            'body-lg',
            'body-sm',
            'label-md',
            'label-sm',
          ],
        },
      ],
    },
  },
});

/** Gộp className có điều kiện và loại bỏ class Tailwind xung đột. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
