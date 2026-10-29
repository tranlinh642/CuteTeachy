'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatShortDate,
  formatWeekdayNarrow,
  getMonthGrid,
  getWeekDays,
  isToday,
  toISODate,
} from '@/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { SCHEDULE_CATEGORIES, type ClassSession, type ScheduleCategory } from '@/types';
import { Button, Card, EmptyState, IconButton, SectionHeader } from '@/components/ui';
import { TaskDialog, TaskItem, useTaskDialog } from '@/features/tasks';
import { AiAssistantFabDrawer } from '@/features/ai-assistant';
import { ClassCard } from './ClassCard';
import { SessionDetailDialog } from './SessionDetailDialog';
import { AdHocSessionDialog } from './AdHocSessionDialog';
import { cn } from '@/utils/cn';
import { useCalendarView } from '../hooks/use-calendar-view';

const CATEGORY_FILTERS: readonly (ScheduleCategory | 'all')[] = ['all', ...SCHEDULE_CATEGORIES];

export interface CalendarViewProps {
  readonly defaultCategoryFilter?: ScheduleCategory | 'all';
}

export function CalendarView({ defaultCategoryFilter = 'all' }: CalendarViewProps = {}) {
  const { t, localeTag } = useTranslation();
  const router = useRouter();
  const {
    year,
    monthIndex,
    monthTitle,
    selectedDate,
    selectedDateLabel,
    selectDate,
    selectCategory,
    goToToday,
    nextMonth,
    previousMonth,
    markers,
    agenda,
    tagsFor,
    toggleTask,
    deleteTask,
  } = useCalendarView();

  const [categoryFilter, setCategoryFilter] = useState<ScheduleCategory | 'all'>(defaultCategoryFilter);
  const taskDialog = useTaskDialog();
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [isAdHocDialogOpen, setIsAdHocDialogOpen] = useState(false);

  const handleSelectCategory = (cat: ScheduleCategory | 'all') => {
    setCategoryFilter(cat);
    selectCategory?.(cat);
  };

  const filteredAgenda = useMemo(() => {
    if (categoryFilter === 'all') return agenda;
    return agenda.filter(
      (entry) =>
        entry.kind === 'class' &&
        (entry.item.category ?? 'school_teaching') === categoryFilter,
    );
  }, [agenda, categoryFilter]);

  const weeks = getMonthGrid(year, monthIndex);
  const weekdays = getWeekDays(new Date(year, monthIndex, 1));

  return (
    <div className="flex flex-col gap-8">
      {/* Tiêu đề & Điều hướng tháng */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-on-surface">{t('calendar.title')}</h1>
          <p className="text-body-lg text-on-surface-variant mt-1">{monthTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon="clock"
            onClick={() => router.push('/timetable')}
          >
            {t('timetable.title')}
          </Button>
          <IconButton
            icon="chevronLeft"
            aria-label={t('calendar.previousMonth')}
            onClick={previousMonth}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={goToToday}
          >
            {t('calendar.today')}
          </Button>
          <IconButton
            icon="chevronRight"
            aria-label={t('calendar.nextMonth')}
            onClick={nextMonth}
          />
        </div>
      </header>

      {/* Bộ lọc nhanh theo Loại lịch (ScheduleCategory) */}
      <div
        data-testid="calendar-category-filter"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        {CATEGORY_FILTERS.map((cat) => {
          const selected = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              data-testid={`calendar-category-filter-${cat}`}
              onClick={() => handleSelectCategory(cat)}
              aria-pressed={selected}
              className={cn(
                'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-body-sm font-medium transition-all whitespace-nowrap cursor-pointer',
                selected
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {t(`calendar.categories.${cat}` as TranslationKey)}
            </button>
          );
        })}
      </div>

      {/* Bố cục 2 phần: Lưới lịch tháng (trái) và Lịch trình ngày chọn (phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lưới lịch tháng */}
        <Card className="lg:col-span-7 p-6 flex flex-col gap-4">
          <div className="grid grid-cols-7 gap-1 text-center pb-2 border-b border-outline-variant/30">
            {weekdays.map((day) => (
              <span
                key={day.toISOString()}
                className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider"
              >
                {formatWeekdayNarrow(day, localeTag)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, wIdx) =>
              week.map((day, dIdx) => {
                if (!day) return <div key={`empty-${wIdx}-${dIdx}`} className="min-h-14" />;

                const iso = toISODate(day);
                const selected = iso === selectedDate;
                const today = isToday(day);
                const count = markers.get(iso) ?? 0;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDate(iso)}
                    aria-pressed={selected}
                    aria-label={`${formatShortDate(day, localeTag)}, ${t('calendar.eventsCount', { count })}`}
                    className={cn(
                      'group relative flex flex-col items-center justify-start min-h-16 p-2 rounded-xl transition-all cursor-pointer',
                      selected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : today
                          ? 'border-2 border-primary bg-primary-container/20 text-on-surface hover:bg-primary-container/40'
                          : 'hover:bg-surface-container text-on-surface',
                    )}
                  >
                    <span className="text-body-lg font-bold tabular-nums">
                      {day.getDate()}
                    </span>

                    {count > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'size-1.5 rounded-full',
                              selected ? 'bg-on-primary' : 'bg-primary',
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </Card>

        {/* Lịch trình trong ngày được chọn */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <SectionHeader
            title={selectedDateLabel}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="add"
                  onClick={() => setIsAdHocDialogOpen(true)}
                >
                  {t('classSession.addAdHocButton')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon="add"
                  onClick={() => taskDialog.openCreate(selectedDate)}
                >
                  {t('tasks.editor.createTitle')}
                </Button>
              </div>
            }
          />

          {filteredAgenda.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={t('calendar.noEvents')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredAgenda.map((entry) => {
                if (entry.kind === 'class') {
                  return (
                    <ClassCard
                      key={`class-${entry.id}`}
                      session={entry.item}
                      onClick={(session) => setSelectedSession(session)}
                    />
                  );
                }
                return (
                  <TaskItem
                    key={`task-${entry.id}`}
                    task={entry.item}
                    tags={tagsFor(entry.item.tagIds)}
                    onToggle={toggleTask}
                    onEdit={taskDialog.openEdit}
                    onDelete={(item) => deleteTask(item.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TaskDialog để thêm / sửa công việc */}
      <TaskDialog
        open={taskDialog.open}
        onClose={taskDialog.close}
        task={taskDialog.task}
        defaultDate={taskDialog.defaultDate}
      />

      {/* SessionDetailDialog xem và sửa chi tiết buổi học */}
      <SessionDetailDialog
        session={selectedSession}
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />

      {/* AdHocSessionDialog thêm buổi lẻ */}
      <AdHocSessionDialog
        open={isAdHocDialogOpen}
        onClose={() => setIsAdHocDialogOpen(false)}
        defaultDate={selectedDate}
        defaultCategory={categoryFilter === 'all' ? 'school_teaching' : categoryFilter}
      />

      {/* Nút mở nhanh Trợ lý AI */}
      <AiAssistantFabDrawer />
    </div>
  );
}
