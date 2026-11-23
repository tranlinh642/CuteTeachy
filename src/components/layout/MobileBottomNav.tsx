'use client';

import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';
import { cn } from '@/utils/cn';
import { NAV_ITEMS, isNavItemActive } from './nav-items';

export interface MobileBottomNavProps {
  readonly className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isKeyboardOpen } = useMobileKeyboard();

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav
      aria-label={t('navigation.mainNav')}
      data-testid="mobile-bottom-nav"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 md:hidden',
        'h-[var(--mobile-bottom-nav-h)] box-border',
        'bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-variant/60 shadow-lg',
        'pb-[env(safe-area-inset-bottom,0px)] pt-1 px-1',
        className,
      )}
    >
      <ul className="grid grid-cols-6 items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const fullLabel = t(item.labelKey);
          const label = item.shortLabelKey ? t(item.shortLabelKey) : fullLabel;

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-label={fullLabel}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 min-h-12 min-w-0 w-full',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full px-2.5 py-0.5 transition-colors',
                    isActive ? 'bg-primary-container text-on-primary-container' : 'bg-transparent',
                  )}
                >
                  <Icon name={item.icon} size={20} />
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-tight mt-0.5 transition-all whitespace-nowrap truncate max-w-full',
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
