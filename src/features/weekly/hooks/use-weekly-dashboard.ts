'use client';

import { useMemo, useState } from 'react';
import { useClasses } from '@/features/calendar';
import { useDeleteTask, useTasks, useToggleTask } from '@/features/tasks';
import { useTags } from '@/features/tags';
import { classesOnDate, getWeekDays, resolveTags, tasksOnDate, toISODate } from '@/utils';
import type { ISODate } from '@/types';

export function useWeeklyDashboard() {
  const [selectedDate, setSelectedDate] = useState<ISODate>(() => toISODate(new Date()));

  const weekDays = useMemo(() => getWeekDays(new Date()), []);
  const range = useMemo(
    () => ({
      from: toISODate(weekDays[0] ?? new Date()),
      to: toISODate(weekDays[weekDays.length - 1] ?? new Date()),
    }),
    [weekDays],
  );

  const classesQuery = useClasses(range);
  const tasksQuery = useTasks(range);
  const { data: tags = [] } = useTags();
  const { toggle } = useToggleTask();
  const deleteTask = useDeleteTask();

  const classes = useMemo(
    () => classesOnDate(classesQuery.data ?? [], selectedDate),
    [classesQuery.data, selectedDate],
  );
  const tasks = useMemo(
    () => tasksOnDate(tasksQuery.data ?? [], selectedDate),
    [tasksQuery.data, selectedDate],
  );

  return {
    weekDays,
    selectedDate,
    selectDate: setSelectedDate,
    classes,
    tasks,
    tagsFor: (tagIds: readonly string[]) => resolveTags(tagIds, tags),
    toggleTask: toggle,
    deleteTask: (id: string) => deleteTask.mutate(id),
    isLoading: classesQuery.isPending || tasksQuery.isPending,
    refetch: () => {
      void classesQuery.refetch();
      void tasksQuery.refetch();
    },
  };
}
