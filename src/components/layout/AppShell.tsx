'use client';

import { useTranslation } from '@/lib/i18n';
import type { ReactNode } from 'react';
import { OfflineIndicator } from '@/components/feedback';
import { MobileBottomNav } from './MobileBottomNav';
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
 * Khung ứng dụng thống nhất:
 * - Desktop: Sidebar cố định bên trái (>= 768px).
 * - Mobile: MobileBottomNav cố định bên dưới (< 768px).
 */
export function AppShell({ sidebarAction, sidebarFooter, topbarTitle, topbarEnd, fab, children }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="bg-primary text-on-primary sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('navigation.skipToContent')}
      </a>
      <Sidebar action={sidebarAction} footer={sidebarFooter} />
      <div className="flex min-h-dvh flex-col md:pl-sidebar">
        <Topbar title={topbarTitle} end={topbarEnd} />
        <OfflineIndicator />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-content flex-1 px-container pt-4 pb-28 md:pb-16 outline-none sm:px-8"
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
      {fab}
    </div>
  );
}
