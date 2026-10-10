import { StyleSheet, View } from 'react-native';
import { formatShortDate, formatWeekdayShort, isToday, toISODate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { spacing } from '@/theme';
import { DayPill } from './DayPill';

export interface WeekStripProps {
  readonly days: readonly Date[];
  readonly selectedDate: ISODate;
  readonly onSelect: (date: ISODate) => void;
}

export function WeekStrip({ days, selectedDate, onSelect }: WeekStripProps) {
  const { localeTag } = useTranslation();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const iso = toISODate(day);
        return (
          <DayPill
            key={iso}
            dayName={formatWeekdayShort(day, localeTag)}
            dateNumber={day.getDate()}
            selected={iso === selectedDate}
            today={isToday(day)}
            accessibilityLabel={formatShortDate(day, localeTag)}
            onPress={() => onSelect(iso)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[1],
  },
});
