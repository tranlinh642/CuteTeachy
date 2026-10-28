'use client';

import { LIMITS } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ID, Tag } from '@/types';
import { useId, useState } from 'react';
import { Button, ConfirmDialog, Dialog, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useDeleteTag } from '../api';
import { useTagForm } from '../hooks/use-tag-form';
import { TonePicker } from './TonePicker';

export interface TagEditorDialogProps {
  readonly tag: Tag | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onUpdated?: (tag: Tag) => void;
  readonly onDeleted?: (tagId: ID) => void;
}

/** Hộp thoại "Chỉnh sửa thẻ" (sửa tên, tone màu, xoá có xác nhận). */
export function TagEditorDialog({
  tag,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: TagEditorDialogProps) {
  if (!tag) return null;

  return (
    <TagEditorDialogContent
      key={tag.id}
      tag={tag}
      open={open}
      onClose={onClose}
      onUpdated={onUpdated}
      onDeleted={onDeleted}
    />
  );
}

interface TagEditorDialogContentProps {
  readonly tag: Tag;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onUpdated?: (tag: Tag) => void;
  readonly onDeleted?: (tagId: ID) => void;
}

function TagEditorDialogContent({
  tag,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: TagEditorDialogContentProps) {
  const { t } = useTranslation();
  const formId = useId();
  const colorLabelId = useId();
  const errorText = useFieldErrorText();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteMutation = useDeleteTag();

  const form = useTagForm({
    initialTag: tag,
    onSuccess: (updated) => {
      onUpdated?.(updated);
      onClose();
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(tag.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false);
        onDeleted?.(tag.id);
        onClose();
      },
    });
  };

  const nameLabel = t('tags.editor.nameLabel');

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={t('tags.editor.editTitle')}
        size="sm"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="danger"
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={form.isSubmitting || deleteMutation.isPending}
            >
              {t('tags.editor.delete')}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={form.isSubmitting || deleteMutation.isPending}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                type="submit"
                form={formId}
                loading={form.isSubmitting}
                disabled={deleteMutation.isPending}
              >
                {t('tags.editor.save')}
              </Button>
            </div>
          </div>
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('tags.deleteConfirmTitle')}
        message={t('tags.deleteConfirmMessage')}
        confirmLabel={t('common.actions.delete')}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
