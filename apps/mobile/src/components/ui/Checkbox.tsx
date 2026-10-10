import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, radius } from '@/theme';
import { Icon } from './Icon';

export interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** Nhãn đọc bởi trình đọc màn hình, ví dụ "Đánh dấu hoàn thành …". */
  readonly accessibilityLabel: string;
  readonly size?: number;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  accessibilityLabel,
  size = 24,
  disabled = false,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)} // đảo trạng thái khi chạm
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.target, pressed && styles.pressed, style]}
    >
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            backgroundColor: checked ? colors.primary : colors.surfaceContainerLowest,
            borderColor: checked ? colors.primary : colors.outline,
          },
        ]}
      >
        {checked ? <Icon name="check" size={size - 6} color={colors.onPrimary} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Vùng chạm luôn ≥ 44px dù ô vuông nhỏ hơn
  target: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    borderWidth: 2,
    borderRadius: radius.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
