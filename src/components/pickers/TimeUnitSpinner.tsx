'use client';

import { useTranslation } from '@/lib/i18n';
import type { KeyboardEvent } from 'react';
import { IconButton } from '@/components/ui';

export interface TimeUnitSpinnerProps {
  /** Tên đơn vị: "Giờ" / "Phút". */
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  /** Chuỗi hiển thị (vd. "09"). */
  readonly display: string;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly autoFocus?: boolean;
}

/** Một cột chọn giờ/phút theo pattern `spinbutton` (mũi tên lên/xuống). */
export function TimeUnitSpinner({
  label,
  value,
  min,
  max,
  display,
  onIncrement,
  onDecrement,
  autoFocus,
}: TimeUnitSpinnerProps) {
  const { t } = useTranslation();
  const unit = label.toLocaleLowerCase();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') onIncrement();
    else if (event.key === 'ArrowDown') onDecrement();
    else return;
    event.preventDefault();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <IconButton
        icon="chevronDown"
        className="rotate-180"
        tabIndex={-1}
        aria-label={t('pickers.time.increase', { unit })}
        onClick={onIncrement}
      />
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={display}
        data-autofocus={autoFocus ? true : undefined}
        onKeyDown={handleKeyDown}
        className="bg-surface-container text-display-md text-on-surface flex h-16 w-20 items-center justify-center rounded-md tabular-nums"
      >
        {display}
      </div>
      <IconButton
        icon="chevronDown"
        tabIndex={-1}
        aria-label={t('pickers.time.decrease', { unit })}
        onClick={onDecrement}
      />
    </div>
  );
}
