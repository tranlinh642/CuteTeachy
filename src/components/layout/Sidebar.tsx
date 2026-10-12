'use client';

import { useTranslation } from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';
import { isNavItemActive, NAV_ITEMS } from './nav-items';
import { SidebarNavLink } from './SidebarNavLink';

export const SIDEBAR_ID = 'app-sidebar';

export interface SidebarProps {
  /** Nút CTA dưới logo (vd. "Tạo công việc"). */
  readonly action?: ReactNode;
  /** Khu vực cuối sidebar (vd. nút đăng xuất). */
  readonly footer?: ReactNode;
}

/** Sidebar cố định ở màn hình máy tính (>= 768px / md:); trên thiết bị di động sử dụng MobileBottomNav chuyên biệt. */
export function Sidebar({ action, footer }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <aside
      id={SIDEBAR_ID}
      className="bg-surface-container-low fixed inset-y-0 left-0 z-40 hidden md:flex w-sidebar flex-col gap-6 overflow-y-auto px-4 py-6 shadow-sm"
    >
      <div>
        <BrandLogo />
      </div>
      {action}
      <nav aria-label={t('navigation.mainNav')} className="flex-1">
        <ul className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SidebarNavLink item={item} active={isNavItemActive(item.href, pathname)} />
            </li>
          ))}
        </ul>
      </nav>
      {footer && <div className="pt-4">{footer}</div>}
    </aside>
  );
}
