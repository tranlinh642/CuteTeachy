import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { colors, textVariants, type TypographyVariant } from '@/theme';

export interface TypographyProps extends TextProps {
  /** Tên kiểu chữ trong design tokens (displayLg, titleLg, bodySm…). */
  readonly variant?: TypographyVariant;
  readonly color?: string;
  readonly align?: TextStyle['textAlign'];
  readonly style?: StyleProp<TextStyle>;
  readonly children: ReactNode;
}

export function Typography({
  variant = 'bodyLg',
  color = colors.onSurface,
  align,
  style,
  children,
  ...rest // numberOfLines, ellipsizeMode, accessibilityRole…
}: TypographyProps) {
  return (
    <Text style={[styles.base, textVariants[variant], { color, textAlign: align }, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
