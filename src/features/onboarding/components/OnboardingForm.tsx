'use client';

import { useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Avatar, Button, Spinner, TextField } from '@/components/ui';
import { useFieldErrorText } from '@/hooks';
import { selectCurrentUser, useSessionStore } from '@/stores';
import { getTeacherAvatarLabel } from '@/utils';
import { toApiError } from '@/lib/api';
import { useUploadAvatar, useDeleteAvatar, validateAvatarFile } from '@/features/profile';
import { useOnboardingForm } from '../hooks/use-onboarding-form';
import { GenderSelector, type GenderOption } from './GenderSelector';

export interface OnboardingFormProps {
  readonly onSuccess?: () => void;
}

export function OnboardingForm({ onSuccess }: OnboardingFormProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const user = useSessionStore(selectCurrentUser);

  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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
  } = useOnboardingForm({ onSuccess });

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);

    // Kiểm tra trước khi gửi: <= 2 MB, jpeg/png/webp; sai -> báo lỗi ngay, không gọi API
    const validation = validateAvatarFile(file);
    if (!validation.valid && validation.errorKey) {
      setAvatarError(t(validation.errorKey));
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
    } catch (err) {
      const apiErr = toApiError(err);
      setAvatarError(t(apiErr.messageKey));
    }
  };

  const handleDeleteAvatar = async () => {
    setAvatarError(null);
    try {
      await deleteAvatar.mutateAsync();
    } catch (err) {
      const apiErr = toApiError(err);
      setAvatarError(t(apiErr.messageKey));
    }
  };

  const genderOptions: readonly GenderOption[] = [
    { value: 'female', label: t('onboarding.genders.female') },
    { value: 'male', label: t('onboarding.genders.male') },
    { value: 'other', label: t('onboarding.genders.other') },
  ];

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg bg-error-container/60 p-3 text-body-sm text-on-error-container"
        >
          {serverError}
        </div>
      )}

      {/* Avatar (Tùy chọn) */}
      <div className="flex items-center gap-4 rounded-xl border border-outline-variant/60 p-3 bg-surface-container-low/40">
        <div className="relative shrink-0">
          <Avatar
            name={displayName || fullName || 'CT'}
            src={user?.avatarUrl}
            size="md"
            label={getTeacherAvatarLabel(user, t)}
          />
          {uploadAvatar.isPending && (
            <div
              role="status"
              aria-label={t('profile.avatar.uploading')}
              className="bg-surface/70 absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-xs"
            >
              <Spinner size="sm" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-sm font-bold text-on-surface">
              {t('onboarding.avatarLabel')}
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarFileChange}
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                className="text-label-sm font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                {user?.avatarUrl ? t('onboarding.changeAvatar') : t('onboarding.uploadAvatar')}
              </button>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                  className="text-label-sm font-medium text-error hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {t('onboarding.removeAvatar')}
                </button>
              )}
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {avatarError ? (
              <span className="text-error font-medium">{avatarError}</span>
            ) : (
              t('onboarding.avatarHint')
            )}
          </p>
        </div>
      </div>

      <TextField
        label={t('onboarding.fullNameLabel')}
        placeholder={t('onboarding.fullNamePlaceholder')}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={formatError(errors.fullName, t('onboarding.fullNameLabel'))}
        icon="person"
        autoFocus
      />

      <TextField
        label={t('onboarding.displayNameLabel')}
        placeholder={t('onboarding.displayNamePlaceholder')}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={formatError(errors.displayName, t('onboarding.displayNameLabel'))}
        hint={t('onboarding.displayNameHint')}
        icon="person"
      />

      <TextField
        label={t('onboarding.titleLabel')}
        placeholder={t('onboarding.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={formatError(errors.title, t('onboarding.titleLabel'))}
        icon="school"
      />

      <GenderSelector
        label={t('onboarding.genderLabel')}
        hint={t('onboarding.genderHint')}
        options={genderOptions}
        value={gender}
        onChange={setGender}
        error={formatError(errors.gender, t('onboarding.genderLabel'))}
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
        >
          {t('onboarding.submit')}
        </Button>
      </div>
    </form>
  );
}
