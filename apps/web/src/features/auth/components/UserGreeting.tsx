'use client';

import { useTranslation } from '@cute-teachy/i18n';
import { useCurrentUser } from '../hooks/use-current-user';

/** Lời chào trên topbar: "Xin chào, Linh". */
export function UserGreeting() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;
  return (
    <p className="text-title-lg sm:text-headline-md text-on-surface truncate text-center">
      {t('weekly.hello', { name: user.displayName })}
    </p>
  );
}
