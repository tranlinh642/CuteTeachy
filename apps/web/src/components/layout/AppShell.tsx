'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { useCallback, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MAIN_CONTENT_ID = 'main-content';

export interface AppShellProps {
  readonly sidebarAction?: ReactNode;
  readonly sidebarFooter?: ReactNode;
  readonly topbarTitle?: ReactNode;
  readonly topbarEnd?: ReactNode;
  /** Nút nổi (FAB) – đặt ngoài `<main>`. */
  readonly fab?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Khung ứng dụng: Sidebar + Topbar + nội dung. Thuần trình bày – các nút
 * phụ thuộc tính năng được truyền qua slot từ route layout.
 */
export function AppShell({ sidebarAction, sidebarFooter, topbarTitle, topbarEnd, fab, children }: AppShellProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="min-h-dvh">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="bg-primary text-on-primary sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('navigation.skipToContent')}
      </a>
      <Sidebar open={menuOpen} onClose={closeMenu} action={sidebarAction} footer={sidebarFooter} />
      <div className="flex min-h-dvh flex-col lg:pl-sidebar">
        <Topbar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} title={topbarTitle} end={topbarEnd} />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto w-full max-w-content flex-1 px-container pt-4 pb-32 outline-none sm:px-8">
          {children}
        </main>
      </div>
      {fab}
    </div>
  );
}
