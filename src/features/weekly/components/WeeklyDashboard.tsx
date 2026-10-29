'use client';

import { useMemo, useState } from 'react';
import {
  formatTeacherDisplayName,
  getAvatarName,
  getGreetingPeriod,
  getTeacherAvatarLabel,
} from '@/utils';
import { selectCurrentUser, useSessionStore } from '@/stores';
import { useTranslation, type TranslationKey } from '@/lib/i18n';
import { SCHEDULE_CATEGORIES, type ScheduleCategory } from '@/types';
import { Avatar, Button, Card, EmptyState, Icon, SectionHeader } from '@/components/ui';
import { TaskDialog, TaskItem, useTaskDialog } from '@/features/tasks';
import { useWeeklyDashboard } from '../hooks/use-weekly-dashboard';
import { ClassCard } from '@/features/calendar';
import { cn } from '@/utils/cn';
import { InspirationCard } from './InspirationCard';
import { WeekStrip } from './WeekStrip';

const CATEGORY_FILTERS: readonly (ScheduleCategory | 'all')[] = ['all', ...SCHEDULE_CATEGORIES];

export interface WeeklyDashboardProps {
  readonly defaultCategoryFilter?: ScheduleCategory | 'all';
}

export function WeeklyDashboard({ defaultCategoryFilter = 'all' }: WeeklyDashboardProps = {}) {
  const { t } = useTranslation();
  const user = useSessionStore(selectCurrentUser);
  const period = getGreetingPeriod();
  const greetingKey = `home.greeting.${period}` as const;

  const {
    weekDays,
    selectedDate,
    selectDate,
    selectCategory,
    classes,
    tasks,
    tagsFor,
    toggleTask,
    deleteTask,
  } = useWeeklyDashboard(defaultCategoryFilter);

  const [categoryFilter, setCategoryFilter] = useState<ScheduleCategory | 'all'>(
    defaultCategoryFilter,
  );
  const taskDialog = useTaskDialog();

  const handleSelectCategory = (cat: ScheduleCategory | 'all') => {
    setCategoryFilter(cat);
    selectCategory?.(cat);
  };

  const filteredClasses = useMemo(() => {
    if (categoryFilter === 'all') return classes;
    return classes.filter((cls) => (cls.category ?? 'school_teaching') === categoryFilter);
  }, [classes, categoryFilter]);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header chào mừng */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-on-surface">
            {t(greetingKey, {
              name: formatTeacherDisplayName(user, t),
            })}
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-1">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon="add"
            onClick={() => taskDialog.openCreate(selectedDate)}
          >
            {t('tasks.editor.createTitle')}
          </Button>
          <Avatar
            name={getAvatarName(user)}
            size="md"
            label={getTeacherAvatarLabel(user, t)}
          />
        </div>
      </header>

      {/* Trọng tâm hôm nay (Focus Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="tonalSubtle" tone="blue" padding="lg" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Icon name="school" size={24} className="text-secondary" />
            <span className="rounded-full bg-secondary-container px-3 py-1 text-label-md font-bold text-on-secondary-container">
              {t('home.scheduleBadge')}
            </span>
          </div>
          <span className="text-display-lg font-bold text-secondary">
            {filteredClasses.length}
          </span>
          <span className="text-label-md font-bold uppercase tracking-wider text-secondary">
            {t('home.classesToday').replace('\n', ' ')}
          </span>
        </Card>

        <Card variant="tonalSubtle" padding="lg" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Icon name="checklist" size={24} className="text-primary" />
            <span className="rounded-full bg-primary-container px-3 py-1 text-label-md font-bold text-on-primary-container">
              {t('home.todoBadge')}
            </span>
          </div>
          <span className="text-display-lg font-bold text-primary">
            {pendingCount}
          </span>
          <span className="text-label-md font-bold uppercase tracking-wider text-primary">
            {t('home.pendingTasks').replace('\n', ' ')}
          </span>
        </Card>
      </div>

      {/* Dải chọn ngày trong tuần & Bộ lọc theo loại lịch */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t('weekly.title')} />
        <WeekStrip days={weekDays} selectedDate={selectedDate} onSelect={selectDate} />
        <div
          data-testid="weekly-category-filter"
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {CATEGORY_FILTERS.map((cat) => {
            const selected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`weekly-category-filter-${cat}`}
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
      </section>

      {/* Bố cục 2 cột chính: Lớp dạy & Việc cá nhân */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Cột lớp dạy */}
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t('weekly.teachingClasses')}
            icon="school"
          />
          {filteredClasses.length === 0 ? (
            <EmptyState
              icon="school"
              title={t('weekly.noClasses')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredClasses.map((cls) => (
                <ClassCard key={cls.id} session={cls} />
              ))}
            </div>
          )}
        </section>

        {/* Cột việc cá nhân */}
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t('weekly.personalTodos')}
            icon="checklist"
            action={
              <Button
                variant="ghost"
                size="sm"
                icon="add"
                onClick={() => taskDialog.openCreate(selectedDate)}
              >
                {t('weekly.addPersonalTask')}
              </Button>
            }
          />
          {tasks.length === 0 ? (
            <EmptyState
              icon="checklist"
              title={t('weekly.noTodos')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  tags={tagsFor(task.tagIds)}
                  onToggle={toggleTask}
                  onEdit={taskDialog.openEdit}
                  onDelete={(t) => deleteTask(t.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Trích dẫn truyền cảm hứng */}
      <InspirationCard />

      {/* Hộp thoại tạo / sửa Task */}
      <TaskDialog
        open={taskDialog.open}
        onClose={taskDialog.close}
        task={taskDialog.task}
        defaultDate={taskDialog.defaultDate}
      />
    </div>
  );
}
