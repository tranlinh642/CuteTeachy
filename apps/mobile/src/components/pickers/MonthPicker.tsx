import { useMemo } from 'react';
import { formatMonthName } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import { OptionGrid } from './OptionGrid';

export interface MonthPickerProps {
  /** 0 – 11 */
  readonly monthIndex: number;
  readonly onSelect: (monthIndex: number) => void;
}

const MONTH_INDEXES = Array.from({ length: 12 }, (_, index) => index);

/** Chọn tháng – tên tháng lấy từ `Intl` theo ngôn ngữ hiện tại. */
export function MonthPicker({ monthIndex, onSelect }: MonthPickerProps) {
  const { localeTag } = useTranslation();
  const items = useMemo(
    () =>
      MONTH_INDEXES.map((index) => ({
        value: index,
        label: formatMonthName(index, localeTag, 'short'),
        accessibilityLabel: formatMonthName(index, localeTag, 'long'),
      })),
    [localeTag],
  );

  return <OptionGrid items={items} selected={monthIndex} onSelect={onSelect} columns={3} />;
}
