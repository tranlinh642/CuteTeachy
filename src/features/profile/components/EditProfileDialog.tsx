'use client';

import { selectCurrentUser, useSessionStore } from '@/stores';
import { useTranslation } from '@/lib/i18n';
import type { Gender } from '@/types';
import { Button, Dialog, SegmentedControl, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { useProfileForm } from '../hooks/use-profile-form';

export interface EditProfileDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function EditProfileDialog({ open, onClose, onSuccess }: EditProfileDialogProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const user = useSessionStore(selectCurrentUser);

  const {
    fullName,
    displayName,
    title,
    gender,
    errors,
    serverError,
    isSubmitting,
    setFullName,
    setDisplayName,
    setTitle,
    setGender,
    submit,
  } = useProfileForm({ open, onClose, onSuccess });

  const genderOptions: readonly { value: Gender; label: string }[] = [
    { value: 'female', label: t('profile.edit.genders.female') },
    { value: 'male', label: t('profile.edit.genders.male') },
    { value: 'other', label: t('profile.edit.genders.other') },
  ];

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {t('common.actions.cancel')}
      </Button>
      <Button
        variant="primary"
        type="submit"
        form="edit-profile-form"
        loading={isSubmitting}
      >
        {t('profile.edit.save')}
      </Button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('profile.edit.modalTitle')}
      footer={footer}
      size="md"
    >
      <form id="edit-profile-form" onSubmit={submit} className="flex flex-col gap-4">
        {serverError && (
          <p className="text-body-sm text-error">{serverError}</p>
        )}

        {/* Email hiển thị nhưng được bảo vệ (Spec-001) */}
        <TextField
          label={t('profile.email')}
          value={user?.email ?? ''}
          disabled
          readOnly
          icon="email"
        />

        <TextField
          label={t('profile.edit.fullNameLabel')}
          placeholder={t('profile.edit.fullNamePlaceholder')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={formatError(errors.fullName, t('profile.edit.fullNameLabel'))}
          icon="person"
          autoFocus
        />

        <TextField
          label={t('profile.edit.displayNameLabel')}
          placeholder={t('profile.edit.displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={formatError(errors.displayName, t('profile.edit.displayNameLabel'))}
          icon="person"
        />

        <TextField
          label={t('profile.edit.titleLabel')}
          placeholder={t('profile.edit.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={formatError(errors.title, t('profile.edit.titleLabel'))}
          icon="school"
        />

        <div className="flex flex-col gap-2">
          <SegmentedControl
            label={t('profile.edit.genderLabel')}
            options={genderOptions}
            value={gender}
            onChange={setGender}
          />
        </div>
      </form>
    </Dialog>
  );
}
