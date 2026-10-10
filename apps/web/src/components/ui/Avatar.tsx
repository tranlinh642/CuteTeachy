import Image from 'next/image';
import { cn } from '@/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  readonly name: string;
  readonly src?: string;
  readonly size?: AvatarSize;
  /** Nhãn a11y (vd. "Ảnh đại diện của Linh"); bỏ trống nếu chỉ trang trí. */
  readonly label?: string;
  readonly className?: string;
}

const SIZE_PX: Readonly<Record<AvatarSize, number>> = { sm: 36, md: 44, lg: 80, xl: 112 };
const TEXT_CLASS: Readonly<Record<AvatarSize, string>> = {
  sm: 'text-label-md',
  md: 'text-body-sm',
  lg: 'text-headline-md',
  xl: 'text-display-md',
};

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Ảnh đại diện tròn; fallback chữ cái đầu trên nền pastel. */
export function Avatar({ name, src, size = 'md', label, className }: AvatarProps) {
  const px = SIZE_PX[size];
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };

  return (
    <span
      {...a11y}
      className={cn(
        'border-surface-container-highest bg-primary-container text-on-primary-container inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 font-bold',
        TEXT_CLASS[size],
        className,
      )}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image src={src} alt="" width={px} height={px} unoptimized className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
