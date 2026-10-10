import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatShortDate, formatWeekdayNarrow, getMonthGrid, getWeekDays, isToday, toISODate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface CalendarGridProps {
  readonly year: number;
  readonly monthIndex: number;
  readonly selectedDate?: ISODate;
  readonly onSelectDate: (date: ISODate) => void;
  /** Số sự kiện theo ngày – hiển thị chấm nhỏ dưới ngày. */
  readonly markers?: ReadonlyMap<ISODate, number>;
}

const MAX_DOTS = 3;

/** Lưới tháng (tuần bắt đầu thứ Hai) dùng cho DatePicker và màn hình Lịch. */
export function CalendarGrid({ year, monthIndex, selectedDate, onSelectDate, markers }: CalendarGridProps) {
  const { t, localeTag } = useTranslation();
  const weeks = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);
  const weekdayLabels = useMemo(
    () => getWeekDays(new Date(year, monthIndex, 1)).map((day) => formatWeekdayNarrow(day, localeTag)),
    [year, monthIndex, localeTag],
  );

  return (
    <View>
      <View style={styles.row}>
        {weekdayLabels.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <Typography variant="labelMd" color={colors.onSurfaceVariant}>
              {label}
            </Typography>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((day, dayIndex) => {
            if (!day) return <View key={`empty-${dayIndex}`} style={styles.cell} />;

            const iso = toISODate(day);
            const selected = iso === selectedDate;
            const today = isToday(day);
            const count = markers?.get(iso) ?? 0;
            const label = count
              ? `${formatShortDate(day, localeTag)}, ${t('calendar.eventsCount', { count })}`
              : formatShortDate(day, localeTag);

            return (
              <Pressable
                key={iso}
                onPress={() => onSelectDate(iso)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected }}
                style={styles.cell}
              >
                <View style={[styles.day, today && styles.dayToday, selected && styles.daySelected]}>
                  <Typography
                    variant="bodyLg"
                    color={selected ? colors.onPrimary : today ? colors.primary : colors.onSurface}
                  >
                    {day.getDate()}
                  </Typography>
                </View>
                <View style={styles.dots}>
                  {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const DAY_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minHeight: layout.minTouchTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
    marginTop: spacing[0.5],
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
