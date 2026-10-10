import { Switch as RNSwitch, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

export interface SwitchProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/** Switch hệ thống với màu theo design tokens. */
export function Switch({ value, onValueChange, accessibilityLabel, disabled = false, style }: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
      thumbColor={value ? colors.primary : colors.surfaceContainerLowest}
      ios_backgroundColor={colors.surfaceContainerHighest}
      style={style}
    />
  );
}
