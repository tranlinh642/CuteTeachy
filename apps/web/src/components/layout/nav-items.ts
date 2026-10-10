import type { TranslationKey } from '@cute-teachy/i18n';
import type { IconName } from '@cute-teachy/tokens';

export interface NavItem {
  readonly href: string;
  readonly labelKey: TranslationKey;
  readonly icon: IconName;
}

/** Điều hướng chính của ứng dụng web (sidebar). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', labelKey: 'navigation.home', icon: 'home' },
  { href: '/calendar', labelKey: 'navigation.calendar', icon: 'calendar' },
  { href: '/notes', labelKey: 'navigation.notes', icon: 'notes' },
  { href: '/profile', labelKey: 'navigation.profile', icon: 'person' },
];

export const isNavItemActive = (href: string, pathname: string): boolean =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
