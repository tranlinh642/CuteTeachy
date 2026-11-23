'use client';

import { useMemo, useState } from 'react';
import { useClasses } from '../api';
import { useDeleteTask, useTasks, useToggleTask } from '@/features/tasks';
import { useTags } from '@/features/tags';
import {
  addMonths,
  buildAgenda,
  countEventsByDate,
  daysInMonth,
  formatMonthYear,
  formatShortDate,
  isValidISODate,
  parseISODate,
  resolveTags,
  toISODate,
} from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ISODate, ScheduleCategory } from '@/types';

function resolveInitialCalendarDate(): ISODate {
  if (typeof window !== 'undefined' && window.location?.search) {
    const rawDate = new URLSearchParams(window.location.search).get('date');
    if (rawDate && isValidISODate(rawDate)) {
      return rawDate;
    }
  }
  return toISODate(new Date());
}

export function useCalendarView() {
  const { localeTag } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<ISODate>(resolveInitialCalendarDate);
  const [currentDate, setCurrentDate] = useState<Date>(() => parseISODate(selectedDate));
  const [selectedCategory, setSelectedCategory] = useState<ScheduleCategory | 'all'>('all');

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const monthRange = useMemo(() => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex, daysInMonth(year, monthIndex));
    return {
      from: toISODate(firstDay),
      to: toISODate(lastDay),
    };
  }, [year, monthIndex]);

  const classesQuery = useClasses(monthRange);
  const tasksQuery = useTasks(monthRange);
  const { data: tags = [] } = useTags();
  const { toggle } = useToggleTask();
  const deleteTask = useDeleteTask();

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const filteredClasses = useMemo(() => {
    if (selectedCategory === 'all') return classes;
    return classes.filter((session) => (session.category ?? 'school_teaching') === selectedCategory);
  }, [classes, selectedCategory]);

  const markers = useMemo(
    () => countEventsByDate(filteredClasses, tasks),
    [filteredClasses, tasks],
  );
  const agenda = useMemo(
    () => buildAgenda(filteredClasses, tasks, selectedDate),
    [filteredClasses, tasks, selectedDate],
  );

  const shiftMonth = (delta: number) => {
    const nextDate = addMonths(currentDate, delta);
    setCurrentDate(nextDate);
    const maxDay = daysInMonth(nextDate.getFullYear(), nextDate.getMonth());
    const currentDay = parseISODate(selectedDate).getDate();
    const clampedDay = Math.min(currentDay, maxDay);
    setSelectedDate(toISODate(new Date(nextDate.getFullYear(), nextDate.getMonth(), clampedDay)));
  };
  const nextMonth = () => shiftMonth(1);
  const previousMonth = () => shiftMonth(-1);
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(toISODate(today));
  };

  const monthTitle = useMemo(() => formatMonthYear(currentDate, localeTag), [currentDate, localeTag]);
  const selectedDateLabel = useMemo(
    () => formatShortDate(parseISODate(selectedDate), localeTag),
    [selectedDate, localeTag],
  );

  return {
    year,
    monthIndex,
    monthTitle,
    selectedDate,
    selectedDateLabel,
    selectDate: setSelectedDate,
    selectedCategory,
    selectCategory: setSelectedCategory,
    goToToday,
    nextMonth,
    previousMonth,
    markers,
    agenda,
    tagsFor: (tagIds: readonly string[]) => resolveTags(tagIds, tags),
    toggleTask: toggle,
    deleteTask: (id: string) => deleteTask.mutate(id),
    isLoading: classesQuery.isPending || tasksQuery.isPending,
  };
}
