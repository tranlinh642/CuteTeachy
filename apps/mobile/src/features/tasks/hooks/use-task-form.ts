import { useState } from 'react';
import { useCreateTask, useUpdateTask } from '@cute-teachy/api';
import { taskSchema, toISODate, validate, type FieldErrors, type TaskFormValues } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate, Task } from '@cute-teachy/types';
import { translateFieldError } from '@/lib/field-error';

export interface UseTaskFormOptions {
  /** Có → chế độ chỉnh sửa. */
  readonly initialTask?: Task;
  readonly defaultDate?: ISODate;
  readonly onDone: () => void;
}

const toFormValues = (task: Task | undefined, defaultDate: ISODate | undefined): TaskFormValues =>
  task
    ? {
        title: task.title,
        date: task.date,
        time: task.time,
        category: task.category,
        priority: task.priority,
        tagIds: [...task.tagIds],
        notes: task.notes ?? '',
      }
    : {
        title: '',
        date: defaultDate ?? toISODate(new Date()),
        category: 'school',
        priority: 'normal',
        tagIds: [],
        notes: '',
      };

/** View-model modal "Công việc mới / Chỉnh sửa công việc". */
export function useTaskForm({ initialTask, defaultDate, onDone }: UseTaskFormOptions) {
  const { t } = useTranslation();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [values, setValues] = useState<TaskFormValues>(() => toFormValues(initialTask, defaultDate));
  const [errors, setErrors] = useState<FieldErrors<TaskFormValues>>({});

  const setField = <K extends keyof TaskFormValues>(field: K, value: TaskFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = validate(taskSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    if (initialTask) {
      updateTask.mutate({ id: initialTask.id, input: result.data }, { onSuccess: onDone });
    } else {
      createTask.mutate(result.data, { onSuccess: onDone });
    }
  };

  const mutationError = createTask.error ?? updateTask.error;

  return {
    isEditing: Boolean(initialTask),
    values,
    setField,
    submit,
    isSubmitting: createTask.isPending || updateTask.isPending,
    errors: {
      title: translateFieldError(t, errors.title, 'tasks.editor.nameLabel'),
      date: translateFieldError(t, errors.date, 'tasks.editor.dateLabel'),
      time: translateFieldError(t, errors.time, 'tasks.editor.timeLabel'),
      notes: translateFieldError(t, errors.notes, 'tasks.editor.notesLabel'),
    },
    submitError: mutationError ? t(mutationError.messageKey) : undefined,
  };
}
