import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadowStyles, spacing, tones, type Tone } from '@/theme';

export type CardVariant = 'elevated' | 'outlined' | 'tonal';

export interface CardProps {
  readonly children: ReactNode;
  readonly variant?: CardVariant;
  /** Chỉ dùng với variant `tonal`: nền pastel theo tone. */
  readonly tone?: Tone;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const getVariantStyle = (variant: CardVariant, tone?: Tone): ViewStyle => {
  switch (variant) {
    case 'outlined':
      return { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant };
    case 'tonal':
      return { backgroundColor: tone ? tones[tone].bg : colors.surfaceContainerLow };
    default:
      return { backgroundColor: colors.surfaceContainerLowest, ...shadowStyles.md };
  }
};

export function Card({ children, variant = 'elevated', tone, onPress, accessibilityLabel, style }: CardProps) {
  const cardStyle = [styles.base, getVariantStyle(variant, tone), style];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing[5],
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
