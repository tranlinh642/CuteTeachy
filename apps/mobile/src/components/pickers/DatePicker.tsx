import { useState } from 'react';
import { View } from 'react-native';
import { addMonths, formatMonthYear, parseISODate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { CalendarGrid } from './CalendarGrid';
import { MonthNavigator } from './MonthNavigator';
import { MonthYearPicker } from './MonthYearPicker';

export interface DatePickerProps {
  readonly value?: ISODate;
  readonly onChange: (date: ISODate) => void;
}

/** Lịch chọn ngày; chạm tiêu đề tháng để chọn nhanh tháng / năm. */
export function DatePicker({ value, onChange }: DatePickerProps) {
  const { t, localeTag } = useTranslation();
  const [visibleMonth, setVisibleMonth] = useState(() => (value ? parseISODate(value) : new Date()));
  const [choosingMonth, setChoosingMonth] = useState(false);

  if (choosingMonth) {
    return (
      <MonthYearPicker
        year={visibleMonth.getFullYear()}
        monthIndex={visibleMonth.getMonth()}
        onSelect={(year, monthIndex) => {
          setVisibleMonth(new Date(year, monthIndex, 1));
          setChoosingMonth(false);
        }}
      />
    );
  }

  return (
    <View>
      <MonthNavigator
        title={formatMonthYear(visibleMonth, localeTag)}
        titleAccessibilityLabel={`${t('calendar.selectMonth')}: ${formatMonthYear(visibleMonth, localeTag)}`}
        onPrevious={() => setVisibleMonth((month) => addMonths(month, -1))}
        onNext={() => setVisibleMonth((month) => addMonths(month, 1))}
        onTitlePress={() => setChoosingMonth(true)}
      />
      <CalendarGrid
        year={visibleMonth.getFullYear()}
        monthIndex={visibleMonth.getMonth()}
        selectedDate={value}
        onSelectDate={onChange}
      />
    </View>
  );
}
