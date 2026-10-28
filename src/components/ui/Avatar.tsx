'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  readonly name: string;
  readonly src?: string | null;
  readonly size?: AvatarSize;
  /** Nhãn a11y (vd. "Ảnh đại diện của Linh"); bỏ trống nếu chỉ trang trí. */
  readonly label?: string;
  /** Viền pastel bao quanh (màn hình Profile). */
  readonly ring?: boolean;
  readonly className?: string;
}

const SIZE_PX: Readonly<Record<AvatarSize, number>> = { sm: 36, md: 44, lg: 80, xl: 112 };
const TEXT_CLASS: Readonly<Record<AvatarSize, string>> = {
  sm: 'text-label-md',
  md: 'text-body-sm',
  lg: 'text-headline-md',
  xl: 'text-display-md',
};

export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Ảnh đại diện tròn; hiển thị ảnh thật, fallback về chữ cái đầu trên nền pastel khi không có ảnh hoặc ảnh lỗi. */
export function Avatar({ name, src, size = 'md', label, ring = false, className }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);

  if (src !== lastSrc) {
    setLastSrc(src);
    setHasError(false);
  }

  const px = SIZE_PX[size];
  const showImage = Boolean(src) && !hasError;
  const meaningfulAlt = label || name.trim() || 'Avatar';
  const a11y = showImage
    ? {}
    : label
      ? { role: 'img' as const, 'aria-label': label }
      : { 'aria-hidden': true as const };

  return (
    <span
      {...a11y}
      className={cn(
        'bg-primary-container text-on-primary-container inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none',
        ring ? 'border-4 border-primary-fixed' : 'border-2 border-surface-container-highest',
        TEXT_CLASS[size],
        className,
      )}
      style={{ width: px, height: px }}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={meaningfulAlt}
          width={px}
          height={px}
          unoptimized
          className="size-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
