import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, radius, shadowStyles, spacing, zIndex } from '@/theme';
import { Icon } from './Icon';

export interface FabProps {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly icon?: IconName;
  /** Khoảng cách tới đáy (ví dụ khi có tab bar). */
  readonly bottomOffset?: number;
  readonly style?: StyleProp<ViewStyle>;
}

const FAB_SIZE = 60;

/** Nút hành động nổi góc phải dưới. Đặt trong View `flex: 1` của màn hình. */
export function Fab({ accessibilityLabel, onPress, icon = 'add', bottomOffset = spacing[5], style }: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, { bottom: bottomOffset }, pressed && styles.pressed, style]}
    >
      <Icon name={icon} size={30} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing[5],
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.lg + 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.fab,
    ...shadowStyles.lg,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});
