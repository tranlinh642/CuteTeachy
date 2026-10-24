'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatTeacherDisplayName,
  getAvatarName,
  getTeacherAvatarLabel,
  getTeacherRole,
  shouldShowFullNameSubtitle,
} from '@/utils';
import { selectCurrentUser, usePreferencesStore, useSessionStore } from '@/stores';
import { APP_VERSION } from '@/config';
import type { ThemePreference } from '@/lib/theme';
import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/types';
import { toApiError } from '@/lib/api';
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  Icon,
  IconButton,
  SectionHeader,
  SegmentedControl,
  Spinner,
  Switch,
} from '@/components/ui';
import { LogoutButton } from '@/features/auth';
import { EditProfileDialog } from './EditProfileDialog';
import { useUploadAvatar, useDeleteAvatar } from '../api';
import { validateAvatarFile } from '../utils/avatar-file';

export function ProfileView() {
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const pushNotifications = usePreferencesStore((s) => s.pushNotifications);
  const setPushNotifications = usePreferencesStore((s) => s.setPushNotifications);
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);

  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [confirmDeleteAvatarOpen, setConfirmDeleteAvatarOpen] = useState(false);

  // Tự động ẩn thông báo thành công sau 4 giây, có dọn dẹp khi unmount
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleEditSuccess = () => {
    setSuccessMessage(t('profile.edit.success'));
  };

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
      setSuccessMessage(t('profile.avatar.uploadSuccess'));
    } catch (err) {
      const apiErr = toApiError(err);
      setAvatarError(t(apiErr.messageKey));
    }
  };

  const handleConfirmDeleteAvatar = async () => {
    setAvatarError(null);
    try {
      await deleteAvatar.mutateAsync();
      setConfirmDeleteAvatarOpen(false);
      setSuccessMessage(t('profile.avatar.deleteSuccess'));
    } catch (err) {
      setConfirmDeleteAvatarOpen(false);
      const apiErr = toApiError(err);
      setAvatarError(t(apiErr.messageKey));
    }
  };

  const languageOptions: readonly { value: Locale; label: string }[] = [
    { value: 'vi', label: t('profile.languages.vi') },
    { value: 'en', label: t('profile.languages.en') },
  ];

  const themeOptions: readonly { value: ThemePreference; label: string }[] = [
    { value: 'auto', label: t('profile.themes.auto') },
    { value: 'pink', label: t('profile.themes.pink') },
    { value: 'blue', label: t('profile.themes.blue') },
  ];

  const showFullNameSubtitle = shouldShowFullNameSubtitle(user);

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <header>
        <h1 className="text-display-lg text-on-surface">{t('profile.title')}</h1>
      </header>

      {/* Thông báo thành công */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl bg-primary-container px-4 py-2 text-body-md font-medium text-on-primary-container shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Icon name="check" size={20} />
            <span>{successMessage}</span>
          </div>
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            onClick={() => setSuccessMessage(null)}
            aria-label={t('common.actions.close')}
          />
        </div>
      )}

      {/* Thông báo lỗi avatar */}
      {avatarError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl bg-error-container/80 px-4 py-2 text-body-md font-medium text-on-error-container shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Icon name="close" size={20} />
            <span>{avatarError}</span>
          </div>
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            onClick={() => setAvatarError(null)}
            aria-label={t('common.actions.close')}
          />
        </div>
      )}

      {/* Thông tin tài khoản */}
      <Card variant="tonalSubtle" padding="lg" className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative">
              <Avatar
                name={getAvatarName(user)}
                src={user?.avatarUrl}
                size="lg"
                label={getTeacherAvatarLabel(user, t)}
                ring
              />
              {uploadAvatar.isPending && (
                <div
                  role="status"
                  aria-label={t('profile.avatar.uploading')}
                  className="bg-surface/70 absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-xs"
                >
                  <Spinner size="md" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
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
                className="text-label-sm text-primary hover:text-primary-fixed-dim hover:underline font-bold disabled:opacity-50 cursor-pointer"
              >
                {user?.avatarUrl ? t('profile.avatar.change') : t('profile.avatar.upload')}
              </button>
              {user?.avatarUrl && (
                <>
                  <span className="text-outline-variant text-label-sm" aria-hidden="true">•</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAvatarOpen(true)}
                    disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                    className="text-label-sm text-error hover:underline font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {t('profile.avatar.delete')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-headline-md font-bold text-on-primary-container truncate">
              {formatTeacherDisplayName(user, t)}
            </h2>
            {showFullNameSubtitle ? (
              <p className="text-body-sm font-medium text-on-surface">
                {user?.fullName}
              </p>
            ) : null}
            <p className="text-body-sm text-on-surface-variant">
              {user?.email ?? ''}
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-0.5 text-label-md font-bold text-on-primary-container self-start">
              <Icon name="school" size={16} />
              <span>{user?.title ?? getTeacherRole(user?.gender, t)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon="edit"
          onClick={() => setIsEditDialogOpen(true)}
        >
          {t('profile.edit.button')}
        </Button>
      </Card>

      {/* Cài đặt: Giao diện */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('profile.themePreferences')} />
        <Card padding="md" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Icon name="palette" size={24} className="text-primary" />
              <div>
                <p className="text-title-md font-medium text-on-surface">{t('profile.themeTitle')}</p>
              </div>
            </div>
            <SegmentedControl
              label={t('profile.themeTitle')}
              options={themeOptions}
              value={themePreference}
              onChange={setThemePreference}
            />
          </div>

          <div className="border-t border-outline-variant/40 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Icon name="language" size={24} className="text-primary" />
              <div>
                <p className="text-title-md font-medium text-on-surface">{t('profile.language')}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {locale === 'vi' ? t('profile.languages.vi') : t('profile.languages.en')}
                </p>
              </div>
            </div>
            <SegmentedControl
              label={t('profile.language')}
              options={languageOptions}
              value={locale}
              onChange={setLocale}
            />
          </div>
        </Card>
      </section>

      {/* Cài đặt: Thông báo */}
      <section className="flex flex-col gap-3">
        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="bell" size={24} className="text-primary" />
            <div>
              <p className="text-title-md font-medium text-on-surface">{t('profile.pushNotifications')}</p>
            </div>
          </div>
          <Switch
            checked={pushNotifications}
            onChange={setPushNotifications}
            label={t('profile.pushNotifications')}
          />
        </Card>
      </section>

      {/* Thông tin phần mềm */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('profile.accountDetails')} />
        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="spa" size={24} className="text-primary" />
            <span className="text-title-md font-medium text-on-surface">{t('common.appName')}</span>
          </div>
          <span className="text-label-md font-bold text-on-surface-variant">{APP_VERSION}</span>
        </Card>
      </section>

      {/* Nút đăng xuất */}
      <div className="pt-2">
        <LogoutButton appearance="block" />
      </div>

      <EditProfileDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDialog
        open={confirmDeleteAvatarOpen}
        onClose={() => setConfirmDeleteAvatarOpen(false)}
        onConfirm={handleConfirmDeleteAvatar}
        title={t('profile.avatar.deleteConfirmTitle')}
        message={t('profile.avatar.deleteConfirmMessage')}
        confirmLabel={t('common.actions.delete')}
        loading={deleteAvatar.isPending}
        destructive
      />
    </div>
  );
}
