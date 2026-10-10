'use client';

import { useState } from 'react';
import type { ISODate, Task } from '@cute-teachy/types';

export function useTaskDialog() {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [defaultDate, setDefaultDate] = useState<ISODate | undefined>(undefined);

  const openCreate = (date?: ISODate) => {
    setTask(undefined);
    setDefaultDate(date);
    setOpen(true);
  };

  const openEdit = (editingTask: Task) => {
    setTask(editingTask);
    setDefaultDate(undefined);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setTask(undefined);
    setDefaultDate(undefined);
  };

  return {
    open,
    task,
    defaultDate,
    openCreate,
    openEdit,
    close,
  };
}
