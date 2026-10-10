import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface DayPillProps {
  readonly dayName: string;
  readonly dateNumber: number;
  readonly selected?: boolean;
  readonly today?: boolean;
  /** Nhãn đầy đủ cho trình đọc màn hình (ví dụ "Th 4, 14 thg 10"). */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

/** Một ngày trong dải tuần (refactor từ DayItem). */
export function DayPill({ dayName, dateNumber, selected = false, today = false, accessibilityLabel, onPress }: DayPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={styles.container}
    >
      <Typography variant="labelSm" color={selected ? colors.primary : colors.onSurfaceVariant}>
        {dayName}
      </Typography>
      <View style={[styles.circle, selected ? styles.circleSelected : today ? styles.circleToday : styles.circleIdle]}>
        <Typography variant="bodyLg" color={selected ? colors.onPrimaryFixedVariant : colors.onSurface}>
          {dateNumber}
        </Typography>
      </View>
    </Pressable>
  );
}

const CIRCLE = 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    minHeight: layout.minTouchTarget,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIdle: {
    backgroundColor: colors.surfaceContainer,
  },
  circleToday: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  circleSelected: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
