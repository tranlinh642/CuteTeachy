'use client';

import { useLogout } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ConfirmDialog, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface LogoutButtonProps {
  /** `sidebar`: kiểu mục điều hướng; `block`: nút lớn (trang Cá nhân). */
  readonly appearance?: 'sidebar' | 'block';
}

/** Đăng xuất có hộp thoại xác nhận; xoá phiên + cache rồi về /login. */
export function LogoutButton({ appearance = 'sidebar' }: LogoutButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useLogout();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirm = () =>
    logout.mutate(undefined, {
      onSettled: () => {
        setConfirmOpen(false);
        router.replace('/login');
      },
    });

  return (
    <>
      {appearance === 'block' ? (
        <Button variant="primary" size="lg" icon="logout" fullWidth onClick={() => setConfirmOpen(true)}>
          {t('profile.logout')}
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={cn(
            'text-on-secondary-container hover:bg-secondary-container/50 flex min-h-touch w-full items-center gap-4 rounded-md px-4 py-3 transition-colors',
          )}
        >
          <Icon name="logout" />
          {t('navigation.logout')}
        </button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirm}
        title={t('profile.logout')}
        message={t('profile.logoutConfirm')}
        confirmLabel={t('profile.logout')}
        loading={logout.isPending}
        destructive
      />
    </>
  );
}
