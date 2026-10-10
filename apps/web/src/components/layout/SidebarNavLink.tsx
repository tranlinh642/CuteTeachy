'use client';

import { useTranslation } from '@cute-teachy/i18n';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { NavItem } from './nav-items';

export interface SidebarNavLinkProps {
  readonly item: NavItem;
  readonly active: boolean;
  readonly onNavigate?: () => void;
}

export function SidebarNavLink({ item, active, onNavigate }: SidebarNavLinkProps) {
  const { t } = useTranslation();
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'flex min-h-touch items-center gap-4 rounded-md border-r-4 px-4 py-3 transition-colors duration-200',
        active
          ? 'border-primary bg-secondary-container/40 text-primary font-bold'
          : 'text-on-secondary-container hover:bg-secondary-container/50 border-transparent',
      )}
    >
      <Icon name={item.icon} filled={active} />
      {t(item.labelKey)}
    </Link>
  );
}
