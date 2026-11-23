'use client';

import { LIMITS } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { Tag } from '@/types';
import { useId } from 'react';
import { Button, Dialog, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useTagForm } from '../hooks/use-tag-form';
import { TonePicker } from './TonePicker';

export interface TagCreatorDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated?: (tag: Tag) => void;
}

/** Hộp thoại "Tạo thẻ mới" (tên + màu). */
export function TagCreatorDialog({ open, onClose, onCreated }: TagCreatorDialogProps) {
  if (!open) return null;

  return <TagCreatorDialogContent open={open} onClose={onClose} onCreated={onCreated} />;
}

function TagCreatorDialogContent({ open, onClose, onCreated }: TagCreatorDialogProps) {
  const { t } = useTranslation();
  const formId = useId();
  const colorLabelId = useId();
  const errorText = useFieldErrorText();
  const form = useTagForm((tag) => {
    onCreated?.(tag);
    onClose();
  });
  const nameLabel = t('tags.editor.nameLabel');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('tags.editor.title')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={form.isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={form.isSubmitting}
            disabled={form.isSubmitting}
          >
            {t('tags.editor.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={form.submit} className="flex flex-col gap-5">
        <TextField
          label={nameLabel}
          placeholder={t('tags.editor.namePlaceholder')}
          value={form.name}
          maxLength={LIMITS.tagNameMax}
          onChange={(event) => form.setName(event.target.value)}
          error={errorText(form.errors.name, nameLabel)}
        />
        <div className="flex flex-col gap-3">
          <span id={colorLabelId} className="text-label-md text-on-surface-variant tracking-wider uppercase">
            {t('tags.editor.colorLabel')}
          </span>
          <TonePicker value={form.tone} onChange={form.setTone} labelledBy={colorLabelId} />
        </div>
        {form.errorKey && form.errorKey !== 'errors.tagNameTaken' && (
          <p role="alert" className="text-body-sm text-error">
            {t(form.errorKey)}
          </p>
        )}
      </form>
    </Dialog>
  );
}
