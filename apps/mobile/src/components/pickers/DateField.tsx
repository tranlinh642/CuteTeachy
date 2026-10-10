import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { formatShortDate, parseISODate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';
import { BottomSheet } from '@/components/ui';
import { DatePicker } from './DatePicker';
import { PickerField } from './PickerField';

export interface DateFieldProps {
  readonly label: string;
  readonly value?: ISODate;
  readonly onChange: (date: ISODate) => void;
  readonly error?: string;
  readonly style?: StyleProp<ViewStyle>;
}

/** Ô chọn ngày: chạm → bottom sheet lịch; chọn ngày là xong. */
export function DateField({ label, value, onChange, error, style }: DateFieldProps) {
  const { t, localeTag } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PickerField
        label={label}
        icon="calendar"
        displayValue={value ? formatShortDate(parseISODate(value), localeTag) : undefined}
        placeholder={t('pickers.date.placeholder')}
        onPress={() => setOpen(true)}
        error={error}
        style={style}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t('pickers.date.title')}>
        <DatePicker
          value={value}
          onChange={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}
