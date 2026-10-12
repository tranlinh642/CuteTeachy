'use client';

import { useTranslation } from '@/lib/i18n';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message?: string;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly loading?: boolean;
}

/** Hộp thoại xác nhận (xoá, đăng xuất…). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} loading={loading} onClick={onConfirm} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message ? <p className="text-body-lg text-on-surface-variant">{message}</p> : null}
    </Dialog>
  );
}
