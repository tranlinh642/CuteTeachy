import { Alert, StyleSheet, View } from 'react-native';
import { useLogout } from '@cute-teachy/api';
import { selectCurrentUser, usePreferencesStore, useSessionStore } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { Locale } from '@cute-teachy/types';
import { ScreenContainer } from '@/components/layout';
import {
  Avatar,
  Button,
  Card,
  Icon,
  SectionHeader,
  SegmentedControl,
  Switch,
  Typography,
} from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';

export function ProfileScreen() {
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const locale = usePreferencesStore((s) => s.locale);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const pushNotifications = usePreferencesStore((s) => s.pushNotifications);
  const setPushNotifications = usePreferencesStore((s) => s.setPushNotifications);

  const logoutMutation = useLogout();

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
    );
  };

  const languageOptions = [
    { value: 'vi' as Locale, label: t('profile.languages.vi') },
    { value: 'en' as Locale, label: t('profile.languages.en') },
  ];

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {/* Thẻ thông tin cá nhân */}
        <Card variant="tonal" tone="pink" style={styles.userCard}>
          <Avatar
            name={user?.displayName ?? 'CT'}
            size={64}
            accessibilityLabel={user?.displayName ?? 'Avatar'}
          />
          <View style={styles.userInfo}>
            <Typography variant="titleLg" color={tones.pink.fg}>
              {user?.fullName ?? user?.displayName ?? 'Cô giáo'}
            </Typography>
            <Typography variant="bodySm" color={colors.onSurfaceVariant}>
              {user?.email ?? 'linh@cuteteachy.vn'}
            </Typography>
            <View style={styles.roleBadge}>
              <Icon name="school" size={14} color={tones.pink.fg} />
              <Typography variant="labelSm" color={tones.pink.fg}>
                {user?.title ?? 'Giáo viên'}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Cài đặt ứng dụng: Ngôn ngữ */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.themePreferences')} />
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconRow}>
                <Icon name="language" size={20} color={colors.primary} />
                <Typography variant="bodyLg">{t('profile.language')}</Typography>
              </View>
            </View>
            <SegmentedControl
              options={languageOptions}
              value={locale}
              onChange={(val) => setLocale(val)}
              accessibilityLabel={t('profile.language')}
            />
          </Card>
        </View>

        {/* Cài đặt thông báo */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.iconRow}>
                <Icon name="bell" size={20} color={colors.primary} />
                <Typography variant="bodyLg">{t('profile.pushNotifications')}</Typography>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                accessibilityLabel={t('profile.pushNotifications')}
              />
            </View>
          </Card>
        </View>

        {/* Thông tin ứng dụng */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.accountDetails')} />
          <Card style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.iconRow}>
                <Icon name="spa" size={20} color={colors.primary} />
                <Typography variant="bodyLg">CuteTeachy</Typography>
              </View>
              <Typography variant="labelMd" color={colors.onSurfaceVariant}>
                v1.0.0
              </Typography>
            </View>
          </Card>
        </View>

        {/* Đăng xuất */}
        <Button
          title={t('profile.logout')}
          variant="danger"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
    paddingTop: spacing[2],
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[5],
  },
  userInfo: {
    flex: 1,
    gap: spacing[1],
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: tones.pink.accent,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: spacing[1],
  },
  section: {
    gap: spacing[2],
  },
  card: {
    padding: spacing[4],
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  logoutButton: {
    marginTop: spacing[2],
  },
});
