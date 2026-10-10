'use client';

import { LIMITS } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { Tag } from '@cute-teachy/types';
import { useId } from 'react';
import { Button, Dialog, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/lib/use-field-error-text';
import { useTagForm } from '../hooks/use-tag-form';
import { TonePicker } from './TonePicker';

export interface TagCreatorDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated?: (tag: Tag) => void;
}

/** Hộp thoại "Tạo thẻ mới" (tên + màu). */
export function TagCreatorDialog({ open, onClose, onCreated }: TagCreatorDialogProps) {
  const { t } = useTranslation();
  const formId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('tags.editor.title')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form={formId}>
            {t('tags.editor.submit')}
          </Button>
        </>
      }
    >
      <TagCreatorForm
        formId={formId}
        onCreated={(tag) => {
          onCreated?.(tag);
          onClose();
        }}
      />
    </Dialog>
  );
}

interface TagCreatorFormProps {
  readonly formId: string;
  readonly onCreated: (tag: Tag) => void;
}

function TagCreatorForm({ formId, onCreated }: TagCreatorFormProps) {
  const { t } = useTranslation();
  const errorText = useFieldErrorText();
  const form = useTagForm(onCreated);
  const colorLabelId = useId();
  const nameLabel = t('tags.editor.nameLabel');

  return (
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
      {form.errorKey && (
        <p role="alert" className="text-body-sm text-error">
          {t(form.errorKey)}
        </p>
      )}
    </form>
  );
}
