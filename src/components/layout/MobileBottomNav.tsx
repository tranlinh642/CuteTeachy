'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { NAV_ITEMS, isNavItemActive } from './nav-items';

export interface MobileBottomNavProps {
  readonly className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('navigation.mainNav')}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 md:hidden',
        'bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-variant/60 shadow-lg',
        'pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 px-2',
        className,
      )}
    >
      <ul className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const label = t(item.labelKey);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 min-h-12',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full px-3.5 py-0.5 transition-colors',
                    isActive ? 'bg-primary-container text-on-primary-container' : 'bg-transparent',
                  )}
                >
                  <Icon name={item.icon} size={22} />
                </div>
                <span
                  className={cn(
                    'text-label-xs mt-0.5 transition-all truncate max-w-18',
                    isActive ? 'font-bold text-primary' : 'font-medium text-on-surface-variant',
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
