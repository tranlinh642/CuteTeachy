import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, layout, radius } from '@/theme';
import { Icon } from './Icon';

export type IconButtonVariant = 'plain' | 'tonal' | 'filled';

export interface IconButtonProps {
  readonly icon: IconName;
  /** Bắt buộc – nút chỉ có icon phải có nhãn cho trình đọc màn hình. */
  readonly accessibilityLabel: string;
  readonly onPress?: () => void;
  readonly variant?: IconButtonVariant;
  readonly color?: string;
  readonly iconSize?: number;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

const VARIANT_BG: Readonly<Record<IconButtonVariant, string>> = {
  plain: 'transparent',
  tonal: colors.surfaceContainerHigh,
  filled: colors.primary,
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  color,
  iconSize = 22,
  disabled = false,
  style,
}: IconButtonProps) {
  const iconColor = color ?? (variant === 'filled' ? colors.onPrimary : colors.onSurfaceVariant);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: VARIANT_BG[variant] },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
