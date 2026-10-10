'use client';

import { useTranslation } from '@cute-teachy/i18n';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui';
import { SIDEBAR_ID } from './Sidebar';

export interface TopbarProps {
  readonly menuOpen: boolean;
  readonly onMenuClick: () => void;
  /** Nội dung giữa (vd. lời chào). */
  readonly title?: ReactNode;
  /** Hành động bên phải (vd. avatar). */
  readonly end?: ReactNode;
}

/** Thanh trên cùng dính (sticky), nền mờ. */
export function Topbar({ menuOpen, onMenuClick, title, end }: TopbarProps) {
  const { t } = useTranslation();
  return (
    <header className="bg-surface/80 sticky top-0 z-10 flex h-topbar items-center gap-3 px-4 backdrop-blur-md sm:px-8">
      <IconButton
        icon="menu"
        aria-label={t('common.a11y.openMenu')}
        aria-expanded={menuOpen}
        aria-controls={SIDEBAR_ID}
        onClick={onMenuClick}
        className="lg:hidden"
      />
      <div className="min-w-0 flex-1">{title}</div>
      {end && <div className="flex shrink-0 items-center gap-2">{end}</div>}
    </header>
  );
}
