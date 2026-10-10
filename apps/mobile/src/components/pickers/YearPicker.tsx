import { useMemo } from 'react';
import { getYearRange } from '@cute-teachy/core';
import { OptionGrid } from './OptionGrid';

export interface YearPickerProps {
  readonly year: number;
  readonly onSelect: (year: number) => void;
  /** Số năm hiển thị mỗi phía so với năm đang chọn. */
  readonly radius?: number;
}

export function YearPicker({ year, onSelect, radius = 7 }: YearPickerProps) {
  const items = useMemo(
    () => getYearRange(year, radius).map((value) => ({ value, label: String(value) })),
    [year, radius],
  );

  return <OptionGrid items={items} selected={year} onSelect={onSelect} columns={3} />;
}
