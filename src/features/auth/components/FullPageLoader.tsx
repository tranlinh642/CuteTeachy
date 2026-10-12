'use client';

import { useTranslation } from '@/lib/i18n';
import { Spinner } from '@/components/ui';

/** Màn hình chờ toàn trang (đợi nạp phiên đăng nhập). */
export function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="text-primary grid min-h-dvh place-items-center">
      <Spinner size="lg" label={t('common.states.loading')} />
    </div>
  );
}
