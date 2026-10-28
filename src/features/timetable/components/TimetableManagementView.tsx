'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Button, ConfirmDialog, EmptyState, IconButton } from '@/components/ui';
import type { TimetableSlot } from '@/types';
import { timeToMinutes, toISODate } from '@/utils';
import { useDeleteTimetableSlot, useTimetableSlots } from '../api';
import { TimetableSlotCard } from './TimetableSlotCard';
import { TimetableSlotDialog } from './TimetableSlotDialog';
import { cn } from '@/utils/cn';

const WEEKDAYS = [
  { value: 1, labelKey: 'timetable.weekdays.mon' },
  { value: 2, labelKey: 'timetable.weekdays.tue' },
  { value: 3, labelKey: 'timetable.weekdays.wed' },
  { value: 4, labelKey: 'timetable.weekdays.thu' },
  { value: 5, labelKey: 'timetable.weekdays.fri' },
  { value: 6, labelKey: 'timetable.weekdays.sat' },
  { value: 7, labelKey: 'timetable.weekdays.sun' },
] as const;

export function TimetableManagementView() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: slots = [], isLoading } = useTimetableSlots();
  const deleteSlot = useDeleteTimetableSlot();

  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createWeekday, setCreateWeekday] = useState<number>(1);
  const [slotToEdit, setSlotToEdit] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  const today = toISODate(new Date());

  // Group slots by weekday, sorted by start time
  const slotsByWeekday = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>();
    for (let day = 1; day <= 7; day++) {
      map.set(day, []);
    }
    for (const slot of slots) {
      const list = map.get(slot.weekday) ?? [];
      list.push(slot);
      map.set(slot.weekday, list);
    }
    // Sort each day by startTime
    for (const [, list] of map.entries()) {
      list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return map;
  }, [slots]);

  const openCreateForDay = (day: number) => {
    setCreateWeekday(day);
    setCreateDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;
    await deleteSlot.mutateAsync(slotToDelete.id);
    setSlotToDelete(null);
  };

  const isDeletingStartedSlot = Boolean(slotToDelete && slotToDelete.effectiveFrom < today);

  const displayedDays = selectedDayFilter === 'all'
    ? WEEKDAYS
    : WEEKDAYS.filter((d) => d.value === selectedDayFilter);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Tiêu đề & Hành động chính */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display-sm sm:text-display-md text-on-surface">
              {t('timetable.title')}
            </h1>
            <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant">
              {t('timetable.totalSlots', { count: slots.length })}
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant mt-1">
            {t('timetable.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            icon="calendar"
            onClick={() => router.push('/calendar')}
          >
            {t('timetable.viewInCalendar')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => openCreateForDay(selectedDayFilter === 'all' ? 1 : selectedDayFilter)}
          >
            {t('timetable.addSlot')}
          </Button>
        </div>
      </header>

      {/* Bộ lọc theo thứ (Mobile cuộn ngang, vùng chạm ≥ 44px) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('all')}
          aria-pressed={selectedDayFilter === 'all'}
          className={cn(
            'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-body-sm font-medium transition-all whitespace-nowrap cursor-pointer',
            selectedDayFilter === 'all'
              ? 'bg-primary text-on-primary font-bold shadow-xs'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
          )}
        >
          {t('timetable.filterAll')}
        </button>

        {WEEKDAYS.map((day) => {
          const count = slotsByWeekday.get(day.value)?.length ?? 0;
          const selected = selectedDayFilter === day.value;
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => setSelectedDayFilter(day.value)}
              aria-pressed={selected}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 justify-center rounded-full px-3.5 text-body-sm transition-all whitespace-nowrap cursor-pointer',
                selected
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <span>{t(day.labelKey)}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-label-xs font-bold',
                    selected ? 'bg-on-primary text-primary' : 'bg-surface-container-highest text-on-surface',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Danh sách tiết theo từng thứ */}
      {!isLoading && slots.length === 0 ? (
        <EmptyState
          icon="school"
          title={t('timetable.emptyState.title')}
          description={t('timetable.emptyState.description')}
          action={
            <Button
              variant="primary"
              icon="add"
              onClick={() => openCreateForDay(1)}
            >
              {t('timetable.emptyState.action')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {displayedDays.map((day) => {
            const daySlots = slotsByWeekday.get(day.value) ?? [];
            return (
              <section
                key={day.value}
                aria-labelledby={`day-heading-${day.value}`}
                className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4 sm:p-5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <h2
                      id={`day-heading-${day.value}`}
                      className="text-title-md font-bold text-on-surface"
                    >
                      {t(day.labelKey)}
                    </h2>
                    <span className="text-label-sm text-on-surface-variant font-medium">
                      ({t('timetable.totalSlots', { count: daySlots.length })})
                    </span>
                  </div>

                  <IconButton
                    icon="add"
                    size="md"
                    aria-label={`${t('timetable.addSlot')} - ${t(day.labelKey)}`}
                    onClick={() => openCreateForDay(day.value)}
                    className="size-touch hover:bg-surface-container"
                  />
                </div>

                {daySlots.length === 0 ? (
                  <p className="py-4 text-center text-body-sm text-outline">
                    {t('timetable.emptyState.title')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {daySlots.map((slot) => (
                      <TimetableSlotCard
                        key={slot.id}
                        slot={slot}
                        onEdit={(s) => setSlotToEdit(s)}
                        onDelete={(s) => setSlotToDelete(s)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Dialog tạo / sửa tiết dạy */}
      <TimetableSlotDialog
        open={createDialogOpen || Boolean(slotToEdit)}
        onClose={() => {
          setCreateDialogOpen(false);
          setSlotToEdit(null);
        }}
        slot={slotToEdit ?? undefined}
        defaultWeekday={createWeekday}
      />

      {/* Dialog xác nhận Ngừng / Xoá tiết dạy */}
      <ConfirmDialog
        open={Boolean(slotToDelete)}
        onClose={() => setSlotToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={
          isDeletingStartedSlot
            ? t('timetable.deleteDialog.stopTitle')
            : t('timetable.deleteDialog.deleteTitle')
        }
        message={
          isDeletingStartedSlot
            ? t('timetable.deleteDialog.stopDescription')
            : t('timetable.deleteDialog.deleteDescription')
        }
        confirmLabel={
          isDeletingStartedSlot
            ? t('timetable.deleteDialog.stopConfirm')
            : t('timetable.deleteDialog.deleteConfirm')
        }
        destructive={!isDeletingStartedSlot}
        loading={deleteSlot.isPending}
      />
    </div>
  );
}
