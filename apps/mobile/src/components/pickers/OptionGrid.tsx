import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface OptionGridItem<T extends number | string> {
  readonly value: T;
  readonly label: string;
  readonly accessibilityLabel?: string;
}

export interface OptionGridProps<T extends number | string> {
  readonly items: readonly OptionGridItem<T>[];
  readonly selected?: T;
  readonly onSelect: (value: T) => void;
  readonly columns?: number;
}

/** Lưới lựa chọn dạng "viên thuốc" – dùng cho MonthPicker / YearPicker. */
export function OptionGrid<T extends number | string>({ items, selected, onSelect, columns = 3 }: OptionGridProps<T>) {
  const basis = `${100 / columns}%` as const;

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {items.map((item) => {
        const isSelected = item.value === selected;
        return (
          <View key={String(item.value)} style={[styles.cell, { flexBasis: basis }]}>
            <Pressable
              onPress={() => onSelect(item.value)}
              accessibilityRole="radio"
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              style={({ pressed }) => [styles.option, isSelected && styles.optionSelected, pressed && styles.pressed]}
            >
              <Typography variant="bodyLg" color={isSelected ? colors.onPrimaryFixedVariant : colors.onSurface}>
                {item.label}
              </Typography>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    padding: spacing[1.5],
  },
  option: {
    minHeight: layout.minTouchTarget + 4,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  optionSelected: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});
