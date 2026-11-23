'use client';

import { useTranslation } from '@/lib/i18n';
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { OfflineIndicator } from '@/components/feedback';
import { LocalReminderTicker, NotificationBell } from '@/features/notifications';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { cn } from '@/utils/cn';
import { MobileBottomNav } from './MobileBottomNav';
import { NAV_ITEMS } from './nav-items';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MAIN_CONTENT_ID = 'main-content';
export const ASSISTANT_NAV_HREF =
  NAV_ITEMS.find((item) => item.href === '/assistant')?.href ?? '/assistant';

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
 * - Mobile: MobileBottomNav cố định bên dưới (< 768px), tự ẩn khi mở bàn phím ảo.
 * - Màn hình Trợ lý AI (/assistant): khóa chiều cao theo viewport để khung chat luôn sát đáy/bàn phím.
 */
export function AppShell({ sidebarAction, sidebarFooter, topbarTitle, topbarEnd, fab, children }: AppShellProps) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const isAssistantRoute = pathname === '/assistant' || pathname.startsWith('/assistant/');
  const { isKeyboardOpen, visualViewportHeight } = useMobileKeyboard();

  // Trên iOS PWA khi bàn phím mở ở màn chat AI, giữ trang không bị đẩy lệch lên trên
  useEffect(() => {
    if (!isAssistantRoute || !isKeyboardOpen || typeof window === 'undefined') return;
    window.scrollTo(0, 0);
  }, [isAssistantRoute, isKeyboardOpen, visualViewportHeight]);

  const assistantViewportStyle =
    isAssistantRoute && isKeyboardOpen && visualViewportHeight
      ? { height: `${visualViewportHeight}px` }
      : undefined;

  return (
    <div
      style={assistantViewportStyle}
      className={cn(
        isAssistantRoute ? 'h-dvh overflow-hidden' : 'min-h-dvh',
      )}
    >
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="bg-primary text-on-primary sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('navigation.skipToContent')}
      </a>
      <Sidebar action={sidebarAction} footer={sidebarFooter} />
      <div
        className={cn(
          'flex flex-col md:pl-sidebar',
          isAssistantRoute ? 'h-full overflow-hidden' : 'min-h-dvh',
        )}
      >
        <Topbar
          title={topbarTitle}
          end={
            <>
              <NotificationBell />
              {topbarEnd}
            </>
          }
        />
        <OfflineIndicator />
        <LocalReminderTicker />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className={cn(
            'mx-auto w-full max-w-content flex-1 outline-none',
            isAssistantRoute
              ? cn(
                  'min-h-0 flex flex-col overflow-hidden px-0 pt-0 md:px-8 md:pt-4 md:pb-6',
                  isKeyboardOpen ? 'pb-0' : 'pb-[var(--mobile-bottom-nav-h)]',
                )
              : 'px-container pt-4 pb-28 md:pb-16 sm:px-8',
          )}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
      {fab}
    </div>
  );
}
