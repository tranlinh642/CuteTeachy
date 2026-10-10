import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, fontFamilyByWeight, layout, radius, shadowStyles, spacing } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly title: string;
  readonly onPress?: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: IconName;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  /** Mặc định dùng `title`. */
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

interface VariantColors {
  readonly bg: string;
  readonly fg: string;
}

const VARIANT_COLORS: Readonly<Record<ButtonVariant, VariantColors>> = {
  primary: { bg: colors.primaryContainer, fg: colors.onPrimaryFixedVariant },
  secondary: { bg: colors.secondaryContainer, fg: colors.onSecondaryFixedVariant },
  ghost: { bg: 'transparent', fg: colors.primary },
  danger: { bg: colors.errorContainer, fg: colors.onErrorContainer },
};

const SIZE_STYLES: Readonly<Record<ButtonSize, ViewStyle>> = {
  sm: { minHeight: layout.minTouchTarget, paddingHorizontal: spacing[4] },
  md: { minHeight: 52, paddingHorizontal: spacing[6] },
  lg: { minHeight: 56, paddingHorizontal: spacing[8] },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { bg, fg } = VARIANT_COLORS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        SIZE_STYLES[size],
        { backgroundColor: bg },
        variant !== 'ghost' && shadowStyles.sm,
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Typography variant={size === 'sm' ? 'bodySm' : 'bodyLg'} color={fg} style={styles.label}>
            {title}
          </Typography>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  label: {
    fontFamily: fontFamilyByWeight['700'],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
