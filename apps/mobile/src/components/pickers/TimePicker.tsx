import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { formatTime, parseTime, toTimeOfDay } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { TimeOfDay } from '@cute-teachy/types';
import { Typography } from '@/components/ui';
import { colors, layout, radius, spacing } from '@/theme';

export interface TimePickerProps {
  readonly value: TimeOfDay;
  readonly onChange: (time: TimeOfDay) => void;
  readonly minuteStep?: number;
}

const ITEM_HEIGHT = layout.minTouchTarget + 4;
const VISIBLE_ITEMS = 5;
const HOURS = Array.from({ length: 24 }, (_, index) => index);

const pad = (value: number): string => String(value).padStart(2, '0');

interface TimeColumnProps {
  readonly label: string;
  readonly values: readonly number[];
  readonly selected: number;
  readonly onSelect: (value: number) => void;
}

function TimeColumn({ label, values, selected, onSelect }: TimeColumnProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Cuộn tới giá trị đang chọn (căn giữa) khi mở
  useEffect(() => {
    const index = Math.max(values.indexOf(selected), 0);
    const offset = Math.max(index - Math.floor(VISIBLE_ITEMS / 2), 0) * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  }, [selected, values]);

  return (
    <View style={styles.column}>
      <Typography variant="labelMd" color={colors.onSurfaceVariant} align="center">
        {label}
      </Typography>
      <ScrollView
        ref={scrollRef}
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        accessibilityLabel={label}
      >
        {values.map((value) => {
          const isSelected = value === selected;
          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${pad(value)}`}
              accessibilityState={{ selected: isSelected }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Typography
                variant={isSelected ? 'headlineMd' : 'titleMd'}
                color={isSelected ? colors.onPrimaryFixedVariant : colors.onSurfaceVariant}
              >
                {pad(value)}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Chọn giờ dạng 2 cột (giờ 00–23, phút theo bước). Hiển thị xem trước theo ngôn ngữ. */
export function TimePicker({ value, onChange, minuteStep = 5 }: TimePickerProps) {
  const { t, localeTag } = useTranslation();
  const { hours, minutes } = parseTime(value);
  const minuteValues = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, index) => index * minuteStep);

  return (
    <View style={styles.container}>
      <Typography variant="displayLg" align="center" accessibilityLiveRegion="polite">
        {formatTime(value, localeTag)}
      </Typography>
      <View style={styles.columns}>
        <TimeColumn
          label={t('pickers.time.hour')}
          values={HOURS}
          selected={hours}
          onSelect={(nextHours) => onChange(toTimeOfDay(nextHours, minutes))}
        />
        <Typography variant="displayMd" color={colors.onSurfaceVariant} style={styles.separator}>
          :
        </Typography>
        <TimeColumn
          label={t('pickers.time.minute')}
          values={minuteValues}
          selected={minutes}
          onSelect={(nextMinutes) => onChange(toTimeOfDay(hours, nextMinutes))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  column: {
    flex: 1,
    gap: spacing[2],
  },
  columnScroll: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
  },
  option: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  optionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  separator: {
    marginTop: spacing[6],
  },
});
