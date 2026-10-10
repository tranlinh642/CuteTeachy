import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { Icon, IconButton, Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface MonthNavigatorProps {
  readonly title: string;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  /** Chạm tiêu đề để mở chọn tháng/năm. */
  readonly onTitlePress?: () => void;
  readonly titleAccessibilityLabel?: string;
  /** Mặc định: "Tháng trước" / "Tháng sau". */
  readonly previousLabel?: string;
  readonly nextLabel?: string;
}

export function MonthNavigator({
  title,
  onPrevious,
  onNext,
  onTitlePress,
  titleAccessibilityLabel,
  previousLabel,
  nextLabel,
}: MonthNavigatorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <IconButton
        icon="chevronLeft"
        accessibilityLabel={previousLabel ?? t('calendar.previousMonth')}
        onPress={onPrevious}
      />
      <Pressable
        onPress={onTitlePress}
        disabled={!onTitlePress}
        accessibilityRole={onTitlePress ? 'button' : 'header'}
        accessibilityLabel={titleAccessibilityLabel ?? title}
        style={({ pressed }) => [styles.title, pressed && styles.pressed]}
      >
        <Typography variant="titleLg" color={colors.onSurface}>
          {title}
        </Typography>
        {onTitlePress ? <Icon name="chevronDown" size={20} color={colors.onSurfaceVariant} /> : null}
      </Pressable>
      <IconButton icon="chevronRight" accessibilityLabel={nextLabel ?? t('calendar.nextMonth')} onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
  },
  pressed: {
    backgroundColor: colors.surfaceContainer,
  },
});
