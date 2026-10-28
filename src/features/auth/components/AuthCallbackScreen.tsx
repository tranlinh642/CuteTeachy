'use client';

import { Suspense } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Spinner } from '@/components/ui';
import { useAuthCallback } from '../hooks/use-auth-callback';

function CallbackContent() {
  const { t } = useTranslation();
  useAuthCallback();

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center" role="status">
      <Spinner size="lg" />
      <p className="text-body-lg text-on-surface-variant font-medium">
        {t('auth.google.callbackLoading')}
      </p>
    </div>
  );
}

/**
 * Màn hình xử lý đổi mã OAuth Google lấy AuthSession.
 * Hiển thị trạng thái đang xử lý và điều hướng ngay khi hoàn tất hoặc lỗi.
 */
export function AuthCallbackScreen() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-surface">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-4 text-center" role="status">
            <Spinner size="lg" />
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </main>
  );
}
