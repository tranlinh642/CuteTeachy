import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { Icon, Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface PickerFieldProps {
  readonly label: string;
  readonly icon: IconName;
  /** Giá trị đã định dạng; rỗng → hiển thị placeholder. */
  readonly displayValue?: string;
  readonly placeholder: string;
  readonly onPress: () => void;
  readonly error?: string;
  readonly style?: StyleProp<ViewStyle>;
}

/** Ô "giả input" mở picker khi chạm (Ngày, Giờ). */
export function PickerField({ label, icon, displayValue, placeholder, onPress, error, style }: PickerFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="labelMd" color={colors.onSurfaceVariant} style={styles.label}>
        {label}
      </Typography>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue ?? placeholder}`}
        accessibilityHint={error}
        style={({ pressed }) => [
          styles.field,
          { borderColor: error ? colors.error : 'transparent' },
          pressed && styles.pressed,
        ]}
      >
        <Icon name={icon} size={20} color={colors.onSurfaceVariant} />
        <Typography
          variant="bodyLg"
          color={displayValue ? colors.onSurface : colors.outline}
          numberOfLines={1}
          style={styles.value}
        >
          {displayValue ?? placeholder}
        </Typography>
      </Pressable>
      {error ? (
        <Typography variant="labelSm" color={colors.error} style={styles.label}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  label: {
    marginLeft: spacing[1],
  },
  field: {
    minHeight: layout.minTouchTarget + 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  value: {
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.surfaceContainer,
  },
});
