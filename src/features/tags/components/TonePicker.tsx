'use client';

import { useTranslation } from '@/lib/i18n';
import { toneNames, type Tone } from '@/lib/theme';
import { useRef, type KeyboardEvent } from 'react';
import { Icon, toneClasses } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface TonePickerProps {
  readonly value: Tone;
  readonly onChange: (tone: Tone) => void;
  /** id nhãn hiển thị của nhóm. */
  readonly labelledBy: string;
}

/** Bảng màu thẻ (radiogroup) – các ô tròn 44px, mũi tên để đổi. */
export function TonePicker({ value, onChange, labelledBy }: TonePickerProps) {
  const { t } = useTranslation();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const nextIndex = (index + delta + toneNames.length) % toneNames.length;
    const next = toneNames[nextIndex];
    if (!next) return;
    onChange(next);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-3">
      {toneNames.map((tone, index) => {
        const selected = tone === value;
        return (
          <button
            key={tone}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t('tags.selectTone', { tone: t(`tags.tones.${tone}`) })}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tone)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'inline-flex size-touch items-center justify-center rounded-full transition-transform duration-200',
              toneClasses[tone].bg,
              toneClasses[tone].fg,
              selected ? cn('ring-offset-surface-container-lowest scale-110 ring-2 ring-offset-2', toneClasses[tone].ring) : 'hover:scale-105',
            )}
          >
            {selected && <Icon name="check" size={20} />}
          </button>
        );
      })}
    </div>
  );
}
