'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';
import { BrandLogo } from './BrandLogo';
import { isNavItemActive, NAV_ITEMS } from './nav-items';
import { SidebarNavLink } from './SidebarNavLink';

export const SIDEBAR_ID = 'app-sidebar';

export interface SidebarProps {
  /** Trạng thái ngăn kéo trên màn hình nhỏ (< lg). */
  readonly open: boolean;
  readonly onClose: () => void;
  /** Nút CTA dưới logo (vd. "Tạo công việc"). */
  readonly action?: ReactNode;
  /** Khu vực cuối sidebar (vd. nút đăng xuất). */
  readonly footer?: ReactNode;
}

/** Sidebar cố định ở desktop; ngăn kéo trượt (có lớp phủ, Esc để đóng) ở màn hình nhỏ. */
export function Sidebar({ open, onClose, action, footer }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const drawerOpen = open && !isDesktop;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, onClose]);

  return (
    <>
      {drawerOpen && (
        <div aria-hidden className="bg-scrim/40 fixed inset-0 z-30 backdrop-blur-[2px] lg:hidden" onClick={onClose} />
      )}
      <aside
        id={SIDEBAR_ID}
        // Ẩn khỏi bàn phím & trình đọc màn hình khi ngăn kéo đóng trên mobile.
        inert={!isDesktop && !open}
        className={cn(
          'bg-surface-container-low fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col gap-6 overflow-y-auto px-4 py-6 shadow-sm',
          'transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative">
          <BrandLogo />
          <IconButton
            icon="close"
            aria-label={t('common.actions.close')}
            onClick={onClose}
            className="absolute -top-2 -right-2 lg:hidden"
          />
        </div>
        {action}
        <nav aria-label={t('navigation.mainNav')} className="flex-1">
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SidebarNavLink item={item} active={isNavItemActive(item.href, pathname)} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </nav>
        {footer && <div className="pt-4">{footer}</div>}
      </aside>
    </>
  );
}
