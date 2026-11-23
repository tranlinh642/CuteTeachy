'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
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
import type { Locale, ReminderLeadMinutes } from '@/types';
import { toApiError, useServices } from '@/lib/api';
import { useSettings, useUpdateSettings } from '@/features/settings';
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
import { validateAvatarFile, validateAvatarSourceFile } from '../utils/avatar-file';
import { compressAvatarImage } from '@/utils/image-resize';
import { usePwaUpdate } from '@/hooks/use-pwa-update';
import { usePushNotification, PushPermissionDialog } from '@/features/push';

export function ProfileView() {
  const { t, locale: currentLocale } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);

  const { push: pushService } = useServices();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const pushNotification = usePushNotification();
  const pwaUpdate = usePwaUpdate();

  const locale = settings?.locale ?? currentLocale;
  const pushEnabled = settings?.pushEnabled ?? true;
  const reminderLeadMinutes = settings?.reminderLeadMinutes ?? 15;

  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [confirmDeleteAvatarOpen, setConfirmDeleteAvatarOpen] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testPushMessage, setTestPushMessage] = useState<string | null>(null);

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

    // Kiểm tra định dạng và trần dung lượng thô trước khi tự động thu nhỏ ảnh về 512x512
    const sourceValidation = validateAvatarSourceFile(file);
    if (!sourceValidation.valid && sourceValidation.errorKey) {
      setAvatarError(t(sourceValidation.errorKey));
      return;
    }

    const optimizedFile = await compressAvatarImage(file);

    // Kiểm tra lại sau khi nén: <= 2 MB, jpeg/png/webp
    const validation = validateAvatarFile(optimizedFile);
    if (!validation.valid && validation.errorKey) {
      setAvatarError(t(validation.errorKey));
      return;
    }

    try {
      await uploadAvatar.mutateAsync(optimizedFile);
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

  const handleLocaleChange = (newLocale: Locale) => {
    setSettingsError(null);
    updateSettings.mutate(
      { locale: newLocale },
      {
        onError: (err) => {
          const apiErr = toApiError(err);
          setSettingsError(t(apiErr.messageKey));
        },
      },
    );
  };

  useEffect(() => {
    if (pushNotification.error) {
      setSettingsError(pushNotification.error);
    }
  }, [pushNotification.error]);

  const handlePushNotificationsChange = (enabled: boolean) => {
    setSettingsError(null);
    if (!enabled) {
      // SPEC-005: Tắt công tắc thông báo chỉ đổi Settings, không huỷ subscription.
      updateSettings.mutate(
        { pushEnabled: false },
        {
          onError: (err) => {
            const apiErr = toApiError(err);
            setSettingsError(t(apiErr.messageKey));
          },
        },
      );
      return;
    }

    if (pushNotification.decision === 'already_granted') {
      // Re-register push subscription with BE to ensure active endpoint
      void pushNotification
        .confirmPermission()
        .catch((err: unknown) => {
          const apiErr = toApiError(err);
          setSettingsError(t(apiErr.messageKey));
        });
      return;
    }

    pushNotification.openDialog();
  };

  const handleDirectPermissionRequest = () => {
    setSettingsError(null);
    void pushNotification
      .confirmPermission()
      .then((success) => {
        if (success) {
          setSuccessMessage(t('push.dialog.successMessage'));
        }
      })
      .catch((err: unknown) => {
        const apiErr = toApiError(err);
        setSettingsError(t(apiErr.messageKey));
      });
  };

  const handleSendTestNotification = async () => {
    setSettingsError(null);
    setTestPushMessage(null);
    setIsTestingPush(true);

    try {
      // Nếu thiết bị đã cấp quyền trên OS nhưng chưa đăng ký subscription, tự kết nối trước khi gửi thử
      if (pushNotification.decision === 'already_granted' && !pushNotification.isSubscribed) {
        await pushNotification.confirmPermission().catch(() => false);
      }

      const sendFn =
        typeof pushNotification.sendTestNotification === 'function'
          ? () => pushNotification.sendTestNotification()
          : () => pushService.sendTestNotification();
      let res = await sendFn();

      // Tự phục hồi nếu trình duyệt còn subscription cũ nhưng server không còn bản ghi (sent === 0)
      if (res.sent === 0 && pushNotification.decision === 'already_granted') {
        const resynced = await pushNotification.confirmPermission().catch(() => false);
        if (resynced) {
          res = await sendFn();
        }
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      if (res.sent > 0) {
        setTestPushMessage(t('push.settings.testSuccessSent', { sent: res.sent }));
      } else {
        setTestPushMessage(t('push.settings.testSuccessInAppOnly'));
      }
    } catch {
      setSettingsError(t('push.settings.testError'));
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleReminderLeadChange = (val: string) => {
    setSettingsError(null);
    updateSettings.mutate(
      { reminderLeadMinutes: Number(val) as ReminderLeadMinutes },
      {
        onError: (err) => {
          const apiErr = toApiError(err);
          setSettingsError(t(apiErr.messageKey));
        },
      },
    );
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

  const reminderLeadOptions: readonly { value: string; label: string }[] = [
    { value: '5', label: t('profile.reminderLeadOptions.min5') },
    { value: '10', label: t('profile.reminderLeadOptions.min10') },
    { value: '15', label: t('profile.reminderLeadOptions.min15') },
    { value: '30', label: t('profile.reminderLeadOptions.min30') },
    { value: '60', label: t('profile.reminderLeadOptions.min60') },
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
          className="flex items-center justify-between rounded-xl bg-error-container px-4 py-2 text-body-md font-medium text-on-error-container shadow-sm"
        >
          <span>{avatarError}</span>
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            onClick={() => setAvatarError(null)}
            aria-label={t('common.actions.close')}
          />
        </div>
      )}

      {/* Thông báo lỗi cài đặt */}
      {settingsError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl bg-error-container px-4 py-2 text-body-md font-medium text-on-error-container shadow-sm"
        >
          <span>{settingsError}</span>
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            onClick={() => setSettingsError(null)}
            aria-label={t('common.actions.close')}
          />
        </div>
      )}

      {/* Thông tin tài khoản */}
      <Card
        variant="tonalSubtle"
        padding="md"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 sm:p-8"
      >
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
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
                className="text-label-sm text-primary hover:text-primary-fixed-dim hover:underline font-bold disabled:opacity-50 cursor-pointer min-h-touch inline-flex items-center px-1 whitespace-nowrap"
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
                    className="text-label-sm text-error hover:underline font-medium disabled:opacity-50 cursor-pointer min-h-touch inline-flex items-center px-1 whitespace-nowrap"
                  >
                    {t('profile.avatar.delete')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h2 className="text-headline-md font-bold text-on-primary-container break-words">
              {formatTeacherDisplayName(user, t)}
            </h2>
            {showFullNameSubtitle ? (
              <p className="text-body-sm font-medium text-on-surface break-words">
                {user?.fullName}
              </p>
            ) : null}
            <p className="text-body-sm text-on-surface-variant break-all">
              {user?.email ?? ''}
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-label-md font-bold text-on-primary-container self-start max-w-full">
              <Icon name="school" size={16} />
              <span className="truncate">{user?.title ?? getTeacherRole(user?.gender, t)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon="edit"
          className="self-start sm:self-center shrink-0 whitespace-nowrap"
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
              onChange={handleLocaleChange}
            />
          </div>
        </Card>
      </section>

      {/* Cài đặt: Thông báo */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('profile.notificationsTitle')} />
        <Card padding="md" className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="bell" size={24} className="text-primary" />
              <div>
                <p className="text-title-md font-medium text-on-surface">{t('profile.pushNotifications')}</p>
                {pushNotification.decision === 'permission_denied' && (
                  <p className="text-body-xs text-error mt-0.5">{t('push.settings.statusDenied')}</p>
                )}
                {pushNotification.decision === 'ios_needs_pwa' && (
                  <p className="text-body-xs text-on-surface-variant mt-0.5">{t('push.settings.statusIosNeedsPwa')}</p>
                )}
                {pushNotification.decision === 'can_prompt' && (
                  <p className="text-body-xs text-on-surface-variant mt-0.5">{t('push.settings.statusNotEnabledOnDevice')}</p>
                )}
                {pushNotification.decision === 'already_granted' && pushNotification.isSubscribed && pushEnabled && (
                  <p className="text-body-xs text-primary mt-0.5">{t('push.settings.statusConnected')}</p>
                )}
              </div>
            </div>
            <Switch
              checked={pushEnabled}
              onChange={handlePushNotificationsChange}
              label={t('profile.pushNotifications')}
            />
          </div>

          {/* Hướng dẫn cài PWA 3 bước cho iOS chưa ở chế độ standalone */}
          {pushNotification.decision === 'ios_needs_pwa' && (
            <div
              data-testid="ios-pwa-guide-card"
              className="rounded-xl bg-surface-container-low border border-primary/20 p-4 flex flex-col gap-3"
            >
              <p className="text-body-sm font-semibold text-on-surface">
                {t('push.dialog.iosGuideTitle')}
              </p>
              <ol className="flex flex-col gap-1.5 text-body-sm text-on-surface-variant list-decimal list-inside">
                <li>{t('push.dialog.iosStep1')}</li>
                <li>{t('push.dialog.iosStep2')}</li>
                <li>{t('push.dialog.iosStep3')}</li>
              </ol>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon="spa"
                  onClick={pushNotification.openDialog}
                >
                  {t('push.settings.openIosGuideButton')}
                </Button>
              </div>
            </div>
          )}

          {/* Nút 1 chạm kích hoạt Notification.requestPermission() trên iOS standalone hoặc Android/Desktop */}
          {pushNotification.decision === 'can_prompt' && (
            <div className="rounded-xl bg-primary-container/30 border border-primary/20 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface flex-1 min-w-48">
                {t('push.banner.description')}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon="bell"
                loading={pushNotification.isSubscribing}
                onClick={handleDirectPermissionRequest}
              >
                {pushNotification.isIos && pushNotification.isStandalone
                  ? t('push.settings.enableIosButton')
                  : t('push.settings.enableDeviceButton')}
              </Button>
            </div>
          )}

          {/* Khi đã cấp quyền trên thiết bị nhưng PushSubscription chưa lưu lên server */}
          {pushNotification.decision === 'already_granted' && !pushNotification.isSubscribed && (
            <div className="rounded-xl bg-secondary-container/35 border border-secondary/20 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface flex-1 min-w-48">
                {t('push.settings.reconnectDeviceHint')}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="bell"
                loading={pushNotification.isSubscribing}
                onClick={handleDirectPermissionRequest}
              >
                {t('push.settings.reconnectDeviceButton')}
              </Button>
            </div>
          )}

          <div className="border-t border-outline-variant/40 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Icon name="clock" size={24} className="text-primary" />
              <div>
                <p className="text-title-md font-medium text-on-surface">{t('profile.reminderLeadMinutes')}</p>
              </div>
            </div>
            <SegmentedControl
              label={t('profile.reminderLeadMinutes')}
              options={reminderLeadOptions}
              value={String(reminderLeadMinutes)}
              onChange={handleReminderLeadChange}
            />
          </div>

          {/* Nút Gửi thông báo thử */}
          <div className="border-t border-outline-variant/40 pt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon name="bell" size={20} className="text-primary" />
                <span className="text-body-md font-medium text-on-surface">
                  {t('push.settings.testButton')}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="bell"
                loading={isTestingPush}
                onClick={() => void handleSendTestNotification()}
              >
                {isTestingPush ? t('push.settings.testSending') : t('push.settings.testButton')}
              </Button>
            </div>

            {testPushMessage && (
              <div
                role="status"
                data-testid="test-push-feedback"
                className="rounded-xl bg-primary-container/60 px-3 py-2 text-body-sm font-medium text-on-primary-container"
              >
                {testPushMessage}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Thông tin phần mềm */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('profile.accountDetails')} />
        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon name="spa" size={24} className="text-primary" />
              <span className="text-title-md font-medium text-on-surface">{t('common.appName')}</span>
            </div>
            <span className="text-label-md font-bold text-on-surface-variant">{APP_VERSION}</span>
          </div>

          <div className="border-t border-outline-variant/40 pt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-body-xs text-on-surface-variant">
              {pwaUpdate.hasUpdate
                ? t('pwa.updateTitle')
                : pwaUpdate.checkStatus === 'up_to_date'
                  ? t('pwa.upToDate')
                  : pwaUpdate.checkStatus === 'unsupported'
                    ? t('pwa.updateUnsupported')
                    : t('pwa.updateDescription')}
            </p>
            {pwaUpdate.hasUpdate ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon="check"
                data-testid="profile-pwa-update-button"
                loading={pwaUpdate.isUpdating}
                onClick={() => void pwaUpdate.applyUpdate()}
              >
                {pwaUpdate.isUpdating ? t('pwa.updatingButton') : t('pwa.updateButton')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="spa"
                data-testid="profile-check-update-button"
                loading={pwaUpdate.checkStatus === 'checking'}
                onClick={() => void pwaUpdate.checkForUpdate()}
              >
                {pwaUpdate.checkStatus === 'checking'
                  ? t('pwa.checkingUpdate')
                  : t('pwa.checkUpdateButton')}
              </Button>
            )}
          </div>
        </Card>
      </section>

      {/* Nút đăng xuất */}
      <div className="pt-2">
        <LogoutButton appearance="block" />
      </div>

      <PushPermissionDialog
        open={pushNotification.isDialogOpen}
        step={pushNotification.dialogStep}
        isSubscribing={pushNotification.isSubscribing}
        error={pushNotification.error}
        onClose={pushNotification.closeDialog}
        onConfirm={pushNotification.confirmPermission}
      />

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
