'use client';

import { useMemo, useState } from 'react';
import { useClasses, useDeleteTask, useTags, useTasks, useToggleTask } from '@cute-teachy/api';
import {
  addMonths,
  buildAgenda,
  countEventsByDate,
  daysInMonth,
  formatMonthYear,
  formatShortDate,
  resolveTags,
  toISODate,
} from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate } from '@cute-teachy/types';

export function useCalendarView() {
  const { localeTag } = useTranslation();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<ISODate>(() => toISODate(new Date()));

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

  const classes = classesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const markers = useMemo(() => countEventsByDate(classes, tasks), [classes, tasks]);
  const agenda = useMemo(() => buildAgenda(classes, tasks, selectedDate), [classes, tasks, selectedDate]);

  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const previousMonth = () => setCurrentDate((d) => addMonths(d, -1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(toISODate(today));
  };

  const monthTitle = useMemo(() => formatMonthYear(currentDate, localeTag), [currentDate, localeTag]);
  const selectedDateLabel = useMemo(
    () => formatShortDate(new Date(selectedDate), localeTag),
    [selectedDate, localeTag],
  );

  return {
    year,
    monthIndex,
    monthTitle,
    selectedDate,
    selectedDateLabel,
    selectDate: setSelectedDate,
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
