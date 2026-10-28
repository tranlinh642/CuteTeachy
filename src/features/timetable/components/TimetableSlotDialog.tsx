'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { useFieldErrorText } from '@/hooks';
import { Button, Dialog, FormField, Icon, TextField } from '@/components/ui';
import { DateField, TimeField } from '@/components/pickers';
import { TonePicker } from '@/features/tags';
import type { ISODate, TimeOfDay, TimetableSlot, Tone } from '@/types';
import {
  timetableSlotSchema,
  toISODate,
  validate,
  type FieldErrors,
  type TimetableSlotFormValues,
} from '@/utils';
import { useCreateTimetableSlot, useUpdateTimetableSlot } from '../api';
import { isTimetableConflictError } from '@/lib/api';
import { cn } from '@/utils/cn';

export interface TimetableSlotDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly slot?: TimetableSlot;
  readonly defaultWeekday?: number;
}

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function TimetableSlotDialog({
  open,
  onClose,
  slot,
  defaultWeekday = 1,
}: TimetableSlotDialogProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const createSlot = useCreateTimetableSlot();
  const updateSlot = useUpdateTimetableSlot();

  const weekdayControlId = useId();
  const toneControlId = useId();
  const today = toISODate(new Date());

  const [weekday, setWeekday] = useState<number>(defaultWeekday);
  const [startTime, setStartTime] = useState<TimeOfDay>('07:30');
  const [endTime, setEndTime] = useState<TimeOfDay>('08:15');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [room, setRoom] = useState('');
  const [tone, setTone] = useState<Tone>('blue');
  const [effectiveFrom, setEffectiveFrom] = useState<ISODate>(today);
  const [effectiveTo, setEffectiveTo] = useState<ISODate | undefined>(undefined);
  const [errors, setErrors] = useState<FieldErrors<TimetableSlotFormValues>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const isEditing = Boolean(slot);
  const isStarted = Boolean(slot && slot.effectiveFrom < today);

  useEffect(() => {
    if (slot) {
      setWeekday(slot.weekday);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setSubject(slot.subject);
      setGrade(slot.grade ?? '');
      setRoom(slot.room ?? '');
      setTone(slot.tone);
      setEffectiveFrom(slot.effectiveFrom);
      setEffectiveTo(slot.effectiveTo ?? undefined);
    } else {
      setWeekday(defaultWeekday);
      setStartTime('07:30');
      setEndTime('08:15');
      setSubject('');
      setGrade('');
      setRoom('');
      setTone('blue');
      setEffectiveFrom(today);
      setEffectiveTo(undefined);
    }
    setErrors({});
    setApiError(null);
  }, [slot, defaultWeekday, open, today]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);

    const validationResult = validate(timetableSlotSchema, {
      weekday,
      startTime,
      endTime,
      subject,
      grade: grade.trim() || undefined,
      room: room.trim() || undefined,
      tone,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
    });

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    setErrors({});

    try {
      if (slot) {
        await updateSlot.mutateAsync({
          id: slot.id,
          input: validationResult.data,
        });
      } else {
        await createSlot.mutateAsync(validationResult.data);
      }
      onClose();
    } catch (err: unknown) {
      if (isTimetableConflictError(err)) {
        setApiError(t('timetable.conflictError'));
      } else {
        setApiError(t('errors.generic'));
      }
    }
  };

  const isSubmitting = createSlot.isPending || updateSlot.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? t('timetable.editSlot') : t('timetable.addSlot')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t('timetable.save')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        {/* Thông báo trước khi sửa slot đã bắt đầu trong quá khứ */}
        {isStarted && (
          <div
            data-testid="split-warning-banner"
            className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary-container/20 p-3.5 text-on-surface"
          >
            <Icon name="spa" className="size-5 shrink-0 text-primary mt-0.5" />
            <div className="text-body-sm">
              <p className="font-bold text-primary">{t('timetable.splitWarning.title')}</p>
              <p className="text-on-surface-variant mt-0.5">{t('timetable.splitWarning.description')}</p>
            </div>
          </div>
        )}

        {/* Lỗi từ API (ví dụ 409 timetable_conflict) */}
        {apiError && (
          <div
            data-testid="api-conflict-error"
            className="flex items-start gap-3 rounded-xl border border-error/40 bg-error-container/20 p-3.5 text-error"
          >
            <Icon name="flag" className="size-5 shrink-0 text-error mt-0.5" />
            <p className="text-body-sm font-semibold">{apiError}</p>
          </div>
        )}

        {/* Chọn Thứ trong tuần (Vùng chạm ≥ 44px) */}
        <FormField
          controlId={weekdayControlId}
          label={t('timetable.fields.weekday')}
          error={formatError(errors.weekday, t('timetable.fields.weekday'))}
        >
          <div id={weekdayControlId} role="radiogroup" aria-label={t('timetable.fields.weekday')} className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => {
              const selected = weekday === day;
              return (
                <button
                  key={day}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setWeekday(day)}
                  className={cn(
                    'flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl p-1 text-center transition-all cursor-pointer',
                    selected
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high',
                  )}
                >
                  <span className="text-body-sm font-bold">
                    {t(`timetable.weekdaysShort.${day}` as TranslationKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Giờ bắt đầu – Giờ kết thúc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TimeField
            label={t('timetable.fields.startTime')}
            value={startTime}
            onChange={(val) => val && setStartTime(val)}
            clearable={false}
            error={formatError(errors.startTime, t('timetable.fields.startTime'))}
          />
          <TimeField
            label={t('timetable.fields.endTime')}
            value={endTime}
            onChange={(val) => val && setEndTime(val)}
            clearable={false}
            error={formatError(errors.endTime, t('timetable.fields.endTime'))}
          />
        </div>

        {/* Môn học */}
        <TextField
          label={t('timetable.fields.subject')}
          placeholder={t('timetable.fields.subjectPlaceholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={formatError(errors.subject, t('timetable.fields.subject'))}
          required
        />

        {/* Lớp học (tùy chọn) & Phòng học (tùy chọn) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label={t('timetable.fields.grade')}
            placeholder={t('timetable.fields.gradePlaceholder')}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            error={formatError(errors.grade, t('timetable.fields.grade'))}
          />
          <TextField
            label={t('timetable.fields.room')}
            placeholder={t('timetable.fields.roomPlaceholder')}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            error={formatError(errors.room, t('timetable.fields.room'))}
          />
        </div>

        {/* Bảng màu pastel */}
        <FormField controlId={toneControlId} label={t('timetable.fields.tone')}>
          <div id={toneControlId}>
            <TonePicker
              value={tone}
              onChange={setTone}
              labelledBy={toneControlId}
            />
          </div>
        </FormField>

        {/* Khoảng thời gian hiệu lực: Từ ngày – Đến ngày */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            label={t('timetable.fields.effectiveFrom')}
            value={effectiveFrom}
            onChange={setEffectiveFrom}
            error={formatError(errors.effectiveFrom, t('timetable.fields.effectiveFrom'))}
          />
          <DateField
            label={t('timetable.fields.effectiveTo')}
            value={effectiveTo}
            onChange={setEffectiveTo}
            error={formatError(errors.effectiveTo, t('timetable.fields.effectiveTo'))}
          />
        </div>
      </form>
    </Dialog>
  );
}
