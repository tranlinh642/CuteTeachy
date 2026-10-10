'use client';

import { selectCurrentUser, usePreferencesStore, useSessionStore } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { Locale } from '@cute-teachy/types';
import { Avatar, Card, Icon, SectionHeader, SegmentedControl, Switch } from '@/components/ui';
import { LogoutButton } from '@/features/auth';

export function ProfileView() {
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const pushNotifications = usePreferencesStore((s) => s.pushNotifications);
  const setPushNotifications = usePreferencesStore((s) => s.setPushNotifications);

  const languageOptions = [
    { value: 'vi' as Locale, label: t('profile.languages.vi') },
    { value: 'en' as Locale, label: t('profile.languages.en') },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <header>
        <h1 className="text-display-lg text-on-surface">{t('profile.title')}</h1>
      </header>

      {/* Thông tin tài khoản */}
      <Card variant="tonal" padding="lg" className="flex items-center gap-5 bg-primary-container/30 border-primary-container/50">
        <Avatar
          name={user?.displayName ?? 'CT'}
          size="lg"
          label={user?.displayName ?? 'Avatar'}
        />
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-headline-md font-bold text-on-primary-container truncate">
            {user?.fullName ?? user?.displayName ?? 'Cô giáo'}
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {user?.email ?? 'linh@cuteteachy.vn'}
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-0.5 text-label-md font-bold text-on-primary-container self-start">
            <Icon name="school" size={16} />
            <span>{user?.title ?? 'Giáo viên'}</span>
          </div>
        </div>
      </Card>

      {/* Cài đặt: Ngôn ngữ */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('profile.themePreferences')} />
        <Card padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="language" size={24} className="text-primary" />
              <div>
                <p className="text-title-md font-medium text-on-surface">{t('profile.language')}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {locale === 'vi' ? t('profile.languages.vi') : t('profile.languages.en')}
                </p>
              </div>
            </div>
          </div>
          <SegmentedControl
            label={t('profile.language')}
            options={languageOptions}
            value={locale}
            onChange={(val) => setLocale(val as Locale)}
          />
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
            <span className="text-title-md font-medium text-on-surface">CuteTeachy</span>
          </div>
          <span className="text-label-md font-bold text-on-surface-variant">v1.0.0</span>
        </Card>
      </section>

      {/* Nút đăng xuất */}
      <div className="pt-2">
        <LogoutButton appearance="block" />
      </div>
    </div>
  );
}
