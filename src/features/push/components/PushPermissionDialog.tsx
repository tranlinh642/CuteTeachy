'use client';

import { useTranslation } from '@/lib/i18n';
import { Button, Dialog, Icon } from '@/components/ui';
import type { PushDialogStep } from '../hooks/use-push-notification';

export interface PushPermissionDialogProps {
  readonly open: boolean;
  readonly step: PushDialogStep;
  readonly isSubscribing?: boolean;
  readonly error?: string | null;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function PushPermissionDialog({
  open,
  step,
  isSubscribing = false,
  error = null,
  onClose,
  onConfirm,
}: PushPermissionDialogProps) {
  const { t } = useTranslation();

  if (step === 'ios_guide') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={t('push.dialog.iosGuideTitle')}
        size="md"
        footer={
          <Button variant="primary" onClick={onClose}>
            {t('push.dialog.understoodButton')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-primary-container/40 flex items-center justify-center text-primary">
              <Icon name="spa" size={36} />
            </div>
          </div>

          <p className="text-body-md text-on-surface">
            {t('push.dialog.iosGuideDescription')}
          </p>

          <div className="rounded-2xl bg-surface-container-low border border-primary/20 p-4 flex items-start gap-3">
            <Icon name="checklist" size={24} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body-sm text-on-surface-variant font-medium leading-relaxed">
              {t('push.dialog.iosGuideInstruction')}
            </p>
          </div>
        </div>
      </Dialog>
    );
  }

  if (step === 'denied_guide') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={t('push.dialog.deniedTitle')}
        size="md"
        footer={
          <Button variant="primary" onClick={onClose}>
            {t('push.dialog.understoodButton')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-error-container/40 flex items-center justify-center text-error">
              <Icon name="lock" size={36} />
            </div>
          </div>

          <p className="text-body-md text-on-surface">
            {t('push.dialog.deniedDescription')}
          </p>

          <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 p-4 flex items-start gap-3">
            <Icon name="settings" size={24} className="text-on-surface-variant shrink-0 mt-0.5" />
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {t('push.dialog.deniedInstruction')}
            </p>
          </div>
        </div>
      </Dialog>
    );
  }

  // Default: Explanation step
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('push.dialog.explanationTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubscribing}>
            {t('push.dialog.dismissButton')}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={isSubscribing}>
            {t('push.dialog.allowButton')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center justify-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/40 flex items-center justify-center text-primary">
            <Icon name="bell" size={36} />
          </div>
        </div>

        <p className="text-body-md text-on-surface leading-relaxed">
          {t('push.dialog.explanationDescription')}
        </p>

        <div className="rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Icon name="school" size={20} className="text-primary shrink-0" />
            <span className="text-body-sm text-on-surface font-medium">
              {t('push.dialog.benefitTimetable')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Icon name="clock" size={20} className="text-primary shrink-0" />
            <span className="text-body-sm text-on-surface font-medium">
              {t('push.dialog.benefitTask')}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-error-container/60 px-4 py-2.5 text-body-sm text-on-error-container"
          >
            {error}
          </div>
        )}
      </div>
    </Dialog>
  );
}
