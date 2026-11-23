'use client';

import { parseTime, toTimeOfDay } from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { TimeOfDay } from '@/types';
import { SegmentedControl } from '@/components/ui';
import { usesHour12 } from './picker-format';
import { TimeUnitSpinner, type TimeWheelOption } from './TimeUnitSpinner';

export interface TimePickerPanelProps {
  readonly value: TimeOfDay;
  readonly onChange: (time: TimeOfDay) => void;
}

type Period = 'am' | 'pm';

const pad = (value: number): string => String(value).padStart(2, '0');

const HOURS_24_OPTIONS: readonly TimeWheelOption[] = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: pad(h),
}));

const HOURS_12_OPTIONS: readonly TimeWheelOption[] = Array.from({ length: 12 }, (_, idx) => {
  const displayHour = idx === 0 ? 12 : idx;
  return { value: idx, label: pad(displayHour) };
});

const MINUTES_OPTIONS: readonly TimeWheelOption[] = Array.from({ length: 60 }, (_, m) => ({
  value: m,
  label: pad(m),
}));

/** Chọn giờ dạng bánh xe vuốt dọc: 12h + SA/CH nếu locale dùng 12h (en), ngược lại 24h (vi). */
export function TimePickerPanel({ value, onChange }: TimePickerPanelProps) {
  const { t, localeTag } = useTranslation();
  const hour12 = usesHour12(localeTag);
  const { hours, minutes } = parseTime(value);
  const period: Period = hours >= 12 ? 'pm' : 'am';

  const setHours = (next: number) => onChange(toTimeOfDay(((next % 24) + 24) % 24, minutes));
  const setMinutes = (next: number) => onChange(toTimeOfDay(hours, ((next % 60) + 60) % 60));

  const hourInPeriod = hours % 12;
  const displayHour = hour12 ? pad(hourInPeriod === 0 ? 12 : hourInPeriod) : pad(hours);

  const handleSelectHourWheel = (wheelVal: number) => {
    if (hour12) {
      setHours(period === 'pm' ? wheelVal + 12 : wheelVal);
    } else {
      setHours(wheelVal);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3" data-vaul-no-drag="">
      {/* Nhãn cột nằm riêng để hàng bánh xe đối xứng tuyệt đối theo trục giữa */}
      <div className="flex items-center justify-center gap-2 px-3">
        <span className="w-24 text-center text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {t('pickers.time.hour')}
        </span>
        <span aria-hidden="true" className="w-3" />
        <span className="w-24 text-center text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {t('pickers.time.minute')}
        </span>
      </div>

      <div className="relative flex items-center justify-center gap-2 px-3">
        {/* Thanh nổi căn giữa kiểu iOS chạy xuyên qua cả 2 cột Giờ : Phút */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-11 rounded-2xl bg-primary-container/55 border border-primary/20"
        />

        <TimeUnitSpinner
          label={t('pickers.time.hour')}
          value={hour12 ? hourInPeriod : hours}
          min={0}
          max={hour12 ? 11 : 23}
          display={displayHour}
          options={hour12 ? HOURS_12_OPTIONS : HOURS_24_OPTIONS}
          onSelect={handleSelectHourWheel}
          onIncrement={() => setHours(hours + 1)}
          onDecrement={() => setHours(hours - 1)}
          autoFocus
        />

        <span
          aria-hidden="true"
          className="relative z-10 w-3 text-center text-headline-md font-bold text-on-primary-container"
        >
          :
        </span>

        <TimeUnitSpinner
          label={t('pickers.time.minute')}
          value={minutes}
          min={0}
          max={59}
          display={pad(minutes)}
          options={MINUTES_OPTIONS}
          onSelect={setMinutes}
          onIncrement={() => setMinutes(minutes + 1)}
          onDecrement={() => setMinutes(minutes - 1)}
        />
      </div>

      <p className="text-label-xs text-on-surface-variant text-center">
        {t('pickers.time.swipeHint')}
      </p>

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
