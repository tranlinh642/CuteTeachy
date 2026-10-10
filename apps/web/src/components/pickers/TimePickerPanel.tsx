'use client';

import { parseTime, toTimeOfDay } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { TimeOfDay } from '@cute-teachy/types';
import { SegmentedControl } from '@/components/ui';
import { usesHour12 } from './picker-format';
import { TimeUnitSpinner } from './TimeUnitSpinner';

export interface TimePickerPanelProps {
  readonly value: TimeOfDay;
  readonly onChange: (time: TimeOfDay) => void;
}

type Period = 'am' | 'pm';

const MINUTE_STEP = 5;
const pad = (value: number): string => String(value).padStart(2, '0');

/** Chọn giờ: 12h + SA/CH nếu locale dùng 12h (en), ngược lại 24h (vi). */
export function TimePickerPanel({ value, onChange }: TimePickerPanelProps) {
  const { t, localeTag } = useTranslation();
  const hour12 = usesHour12(localeTag);
  const { hours, minutes } = parseTime(value);
  const period: Period = hours >= 12 ? 'pm' : 'am';

  const setHours = (next: number) => onChange(toTimeOfDay((next + 24) % 24, minutes));
  const setMinutes = (next: number) => onChange(toTimeOfDay(hours, (next + 60) % 60));

  const minuteUp = () => setMinutes(Math.floor(minutes / MINUTE_STEP) * MINUTE_STEP + MINUTE_STEP);
  const minuteDown = () => setMinutes(minutes % MINUTE_STEP ? minutes - (minutes % MINUTE_STEP) : minutes - MINUTE_STEP);

  const displayHour = hour12 ? pad(hours % 12 || 12) : pad(hours);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <TimeUnitSpinner
          label={t('pickers.time.hour')}
          value={hours}
          min={0}
          max={23}
          display={displayHour}
          onIncrement={() => setHours(hours + 1)}
          onDecrement={() => setHours(hours - 1)}
          autoFocus
        />
        <span aria-hidden className="text-display-md text-on-surface-variant">
          :
        </span>
        <TimeUnitSpinner
          label={t('pickers.time.minute')}
          value={minutes}
          min={0}
          max={59}
          display={pad(minutes)}
          onIncrement={minuteUp}
          onDecrement={minuteDown}
        />
      </div>
      {hour12 && (
        <SegmentedControl<Period>
          label={t('pickers.time.title')}
          value={period}
          onChange={(next) => {
            if (next !== period) setHours(next === 'pm' ? hours + 12 : hours - 12);
          }}
          options={[
            { value: 'am', label: t('pickers.time.am') },
            { value: 'pm', label: t('pickers.time.pm') },
          ]}
          className="w-full max-w-64"
        />
      )}
    </div>
  );
}
