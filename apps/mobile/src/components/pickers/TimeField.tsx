import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { formatTime } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { TimeOfDay } from '@cute-teachy/types';
import { BottomSheet, Button } from '@/components/ui';
import { PickerField } from './PickerField';
import { TimePicker } from './TimePicker';

export interface TimeFieldProps {
  readonly label: string;
  readonly value?: TimeOfDay;
  readonly onChange: (time: TimeOfDay | undefined) => void;
  readonly error?: string;
  /** Giờ gợi ý khi chưa có giá trị. */
  readonly defaultTime?: TimeOfDay;
  readonly style?: StyleProp<ViewStyle>;
}

/** Ô chọn giờ: chạm → sheet TimePicker, xác nhận bằng nút "Xong". */
export function TimeField({ label, value, onChange, error, defaultTime = '08:00', style }: TimeFieldProps) {
  const { t, localeTag } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TimeOfDay>(value ?? defaultTime);

  const openPicker = () => {
    setDraft(value ?? defaultTime);
    setOpen(true);
  };

  return (
    <>
      <PickerField
        label={label}
        icon="clock"
        displayValue={value ? formatTime(value, localeTag) : undefined}
        placeholder={t('pickers.time.placeholder')}
        onPress={openPicker}
        error={error}
        style={style}
      />
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t('pickers.time.title')}
        placement="center"
        scrollable={false}
        footer={
          <>
            <Button
              title={t('common.actions.cancel')}
              variant="ghost"
              onPress={() => setOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              title={t('pickers.confirm')}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <TimePicker value={draft} onChange={setDraft} />
      </BottomSheet>
    </>
  );
}
