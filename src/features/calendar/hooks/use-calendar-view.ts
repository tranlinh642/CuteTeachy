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
  resolveTags,
  toISODate,
} from '@/utils';
import { useTranslation } from '@/lib/i18n';
import type { ISODate, ScheduleCategory } from '@/types';

export function useCalendarView() {
  const { localeTag } = useTranslation();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<ISODate>(() => toISODate(new Date()));
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

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return [];
  }, [tasks, selectedCategory]);

  const markers = useMemo(
    () => countEventsByDate(filteredClasses, filteredTasks),
    [filteredClasses, filteredTasks],
  );
  const agenda = useMemo(
    () => buildAgenda(filteredClasses, filteredTasks, selectedDate),
    [filteredClasses, filteredTasks, selectedDate],
  );

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
