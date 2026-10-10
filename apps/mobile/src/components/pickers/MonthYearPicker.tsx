import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { Icon, Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';
import { MonthPicker } from './MonthPicker';
import { YearPicker } from './YearPicker';

export interface MonthYearPickerProps {
  readonly year: number;
  readonly monthIndex: number;
  readonly onSelect: (year: number, monthIndex: number) => void;
}

type Mode = 'months' | 'years';

/** Chọn tháng; chạm vào năm để chuyển sang lưới chọn năm. */
export function MonthYearPicker({ year, monthIndex, onSelect }: MonthYearPickerProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('months');
  const [draftYear, setDraftYear] = useState(year);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="titleMd" accessibilityRole="header">
          {mode === 'months' ? t('pickers.month.title') : t('pickers.year.title')}
        </Typography>
        {mode === 'months' ? (
          <Pressable
            onPress={() => setMode('years')}
            accessibilityRole="button"
            accessibilityLabel={`${t('calendar.selectYear')}: ${draftYear}`}
            style={({ pressed }) => [styles.yearButton, pressed && styles.pressed]}
          >
            <Typography variant="bodyLg" color={colors.primary}>
              {draftYear}
            </Typography>
            <Icon name="chevronDown" size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {mode === 'months' ? (
        <MonthPicker
          monthIndex={draftYear === year ? monthIndex : -1}
          onSelect={(nextMonth) => onSelect(draftYear, nextMonth)}
        />
      ) : (
        <YearPicker
          year={draftYear}
          onSelect={(nextYear) => {
            setDraftYear(nextYear);
            setMode('months');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
  },
  pressed: {
    opacity: 0.8,
  },
});
