import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: IconName;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

/** Nhóm lựa chọn một trong nhiều (Trường học / Cá nhân, Tiếng Việt / English). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        const fg = selected ? colors.onPrimaryFixedVariant : colors.onSurfaceVariant;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              selected ? styles.segmentSelected : styles.segmentIdle,
              pressed && styles.pressed,
            ]}
          >
            {option.icon ? <Icon name={option.icon} size={20} color={fg} /> : null}
            <Typography variant="bodySm" color={fg}>
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  segment: {
    flex: 1,
    minHeight: layout.minTouchTarget + 4,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
  },
  segmentIdle: {
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  segmentSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryContainer,
  },
  pressed: {
    opacity: 0.8,
  },
});
