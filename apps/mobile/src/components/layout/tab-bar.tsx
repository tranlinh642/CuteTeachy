import { StyleSheet, View, type ColorValue } from 'react-native';
import type { TranslationKey } from '@cute-teachy/i18n';
import type { IconName } from '@cute-teachy/tokens';
import { colors, fontFamilyByWeight, radius } from '@/theme';
import { Icon } from '../ui/Icon';

/** Một tab trong `(tabs)/_layout.tsx` – `name` khớp tên file route. */
export interface TabItem {
  readonly name: 'index' | 'calendar' | 'notes' | 'profile';
  readonly titleKey: TranslationKey;
  readonly icon: IconName;
}

export const TAB_ITEMS: readonly TabItem[] = [
  { name: 'index', titleKey: 'navigation.home', icon: 'home' },
  { name: 'calendar', titleKey: 'navigation.calendar', icon: 'calendar' },
  { name: 'notes', titleKey: 'navigation.notes', icon: 'notes' },
  { name: 'profile', titleKey: 'navigation.profile', icon: 'person' },
];

export interface TabBarIconProps {
  readonly icon: IconName;
  readonly focused: boolean;
  readonly color: ColorValue;
}

/** Icon tab với nền "viên thuốc" hồng khi đang chọn (theo design). */
export function TabBarIcon({ icon, focused, color }: TabBarIconProps) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Icon name={icon} size={22} color={color} />
    </View>
  );
}

/** `screenOptions` dùng chung cho navigator Tabs. */
export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.onPrimaryFixedVariant,
  tabBarInactiveTintColor: colors.onSurfaceVariant,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.outlineVariant,
    minHeight: 64,
  },
  tabBarLabelStyle: {
    fontFamily: fontFamilyByWeight['600'],
    fontSize: 11,
  },
  tabBarItemStyle: {
    paddingTop: 6,
  },
  sceneStyle: {
    backgroundColor: colors.background,
  },
} as const;

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primaryContainer,
  },
});
