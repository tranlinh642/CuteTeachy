'use client';

import type { ReactNode } from 'react';

export interface TopbarProps {
  /** Nội dung giữa (vd. lời chào). */
  readonly title?: ReactNode;
  /** Hành động bên phải (vd. avatar). */
  readonly end?: ReactNode;
}

/** Thanh trên cùng dính (sticky), nền mờ. */
export function Topbar({ title, end }: TopbarProps) {
  return (
    <header className="bg-surface/80 sticky top-0 z-10 flex h-topbar items-center gap-3 px-4 backdrop-blur-md sm:px-8">
      <div className="min-w-0 flex-1">{title}</div>
      {end && <div className="flex shrink-0 items-center gap-2">{end}</div>}
    </header>
  );
}
