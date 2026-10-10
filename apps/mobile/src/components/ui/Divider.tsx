import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';

export interface DividerProps {
  /** Thụt lề trái (ví dụ thẳng hàng với nội dung sau icon). */
  readonly inset?: number;
  readonly spacingY?: number;
  readonly style?: StyleProp<ViewStyle>;
}

export function Divider({ inset = 0, spacingY = 0, style }: DividerProps) {
  return <View style={[styles.line, { marginLeft: inset, marginVertical: spacingY }, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing[0],
  },
});
