'use client';

import { useTranslation } from '@/lib/i18n';
import { toneClasses } from '@/components/ui';
import { Card, Icon, IconButton } from '@/components/ui';
import type { TimetableSlot } from '@/types';
import { formatNumericDate } from '@/components/pickers/picker-format';
import { formatTimeRange, parseISODate, toISODate } from '@/utils';
import { cn } from '@/utils/cn';

export interface TimetableSlotCardProps {
  readonly slot: TimetableSlot;
  readonly onEdit: (slot: TimetableSlot) => void;
  readonly onDelete: (slot: TimetableSlot) => void;
  readonly className?: string;
}

export function TimetableSlotCard({ slot, onEdit, onDelete, className }: TimetableSlotCardProps) {
  const { t, localeTag } = useTranslation();
  const today = toISODate(new Date());

  const isStarted = slot.effectiveFrom < today;
  const isExpired = Boolean(slot.effectiveTo && slot.effectiveTo < today);
  const isFuture = slot.effectiveFrom > today;

  const tone = toneClasses[slot.tone] ?? toneClasses.blue;

  const fromFormatted = formatNumericDate(parseISODate(slot.effectiveFrom), localeTag);
  const toFormatted = slot.effectiveTo
    ? formatNumericDate(parseISODate(slot.effectiveTo), localeTag)
    : null;

  return (
    <Card
      data-testid={`slot-card-${slot.id}`}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden p-4 pl-5 transition-all hover:shadow-md',
        isExpired ? 'opacity-60 bg-surface-container/40' : 'bg-surface-container-lowest',
        className,
      )}
    >
      {/* Vạch màu pastel nhận diện bên trái */}
      <span className={cn('absolute left-0 top-0 bottom-0 w-1.5', tone.accent)} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Giờ học & Trạng thái hiệu lực */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-md font-bold text-on-surface tabular-nums">
              {formatTimeRange(slot.startTime, slot.endTime, localeTag)}
            </span>

            {isExpired && (
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-xs font-medium text-on-surface-variant">
                {t('timetable.slot.expired')}
              </span>
            )}
            {isFuture && (
              <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-label-xs font-medium text-on-secondary-container">
                {t('timetable.slot.future')}
              </span>
            )}
            {!isExpired && !isFuture && (
              <span className="rounded-full bg-primary-container/60 px-2 py-0.5 text-label-xs font-medium text-on-primary-container">
                {t('timetable.slot.activeNow')}
              </span>
            )}
          </div>

          {/* Môn học */}
          <h3 className="text-title-md font-bold text-on-surface truncate mt-1">
            {slot.subject}
          </h3>

          {/* Lớp & Phòng học */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-body-sm text-on-surface-variant">
            {slot.grade ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 font-medium">
                <Icon name="school" size={14} className="text-on-surface-variant" />
                {slot.grade}
              </span>
            ) : null}

            {slot.room ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 font-medium">
                <Icon name="home" size={14} className="text-on-surface-variant" />
                {slot.room}
              </span>
            ) : null}
          </div>

          {/* Khoảng hiệu lực */}
          <p className="text-label-sm text-on-surface-variant mt-2 flex items-center gap-1">
            <Icon name="calendar" size={14} className="text-outline" />
            <span>
              {toFormatted
                ? t('timetable.slot.effectiveRange', { from: fromFormatted, to: toFormatted })
                : t('timetable.slot.effectiveFromOnly', { from: fromFormatted })}
            </span>
          </p>
        </div>

        {/* Nút hành động: Sửa / Xoá (vùng chạm cảm ứng ≥ 44px) */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon="edit"
            size="md"
            aria-label={t('timetable.editSlot')}
            onClick={() => onEdit(slot)}
            className="size-touch hover:bg-surface-container"
          />
          <IconButton
            icon="delete"
            size="md"
            aria-label={isStarted ? t('timetable.stopSlot') : t('timetable.deleteSlot')}
            onClick={() => onDelete(slot)}
            className="size-touch text-error hover:bg-error-container/20"
          />
        </div>
      </div>
    </Card>
  );
}
