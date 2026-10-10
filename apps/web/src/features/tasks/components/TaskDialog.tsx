'use client';

import { useEffect, useState } from 'react';
import { useCreateTask, useUpdateTask } from '@cute-teachy/api';
import { taskSchema, toISODate, validate, type FieldErrors, type TaskFormValues } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ID, ISODate, Task, TaskCategory, TaskPriority, TimeOfDay } from '@cute-teachy/types';
import { DateField, TimeField } from '@/components/pickers';
import { Button, Dialog, SegmentedControl, Switch, TextArea, TextField } from '@/components/ui';
import { TagPicker } from '@/features/tags';
import { useFieldErrorText } from '@/lib/use-field-error-text';

export interface TaskDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly task?: Task;
  readonly defaultDate?: ISODate;
}

export function TaskDialog({ open, onClose, task, defaultDate }: TaskDialogProps) {
  const { t } = useTranslation();
  const formatError = useFieldErrorText();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<ISODate>(() => defaultDate ?? toISODate(new Date()));
  const [time, setTime] = useState<TimeOfDay | undefined>(undefined);
  const [category, setCategory] = useState<TaskCategory>('school');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [tagIds, setTagIds] = useState<ID[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FieldErrors<TaskFormValues>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date);
      setTime(task.time);
      setCategory(task.category);
      setPriority(task.priority);
      setTagIds([...task.tagIds]);
      setNotes(task.notes ?? '');
    } else {
      setTitle('');
      setDate(defaultDate ?? toISODate(new Date()));
      setTime(undefined);
      setCategory('school');
      setPriority('normal');
      setTagIds([]);
      setNotes('');
    }
    setErrors({});
  }, [task, defaultDate, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = validate(taskSchema, {
      title,
      date,
      time: time || undefined,
      category,
      priority,
      tagIds,
      notes: notes || undefined,
    });

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    if (task) {
      await updateTask.mutateAsync({ id: task.id, input: result.data });
    } else {
      await createTask.mutateAsync(result.data);
    }
    onClose();
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? t('tasks.editor.editTitle') : t('tasks.editor.createTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {t('tasks.editor.save')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label={t('tasks.editor.nameLabel')}
          placeholder={t('tasks.editor.namePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={formatError(errors.title, t('tasks.editor.nameLabel'))}
          required
          data-autofocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            label={t('tasks.editor.dateLabel')}
            value={date}
            onChange={(d) => setDate(d)}
            error={formatError(errors.date, t('tasks.editor.dateLabel'))}
          />
          <TimeField
            label={t('tasks.editor.timeLabel')}
            value={time}
            onChange={(val) => setTime(val)}
            error={formatError(errors.time, t('tasks.editor.timeLabel'))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
            {t('tasks.editor.categoryLabel')}
          </label>
          <SegmentedControl
            label={t('tasks.editor.categoryLabel')}
            options={[
              { value: 'school', label: t('tasks.category.school'), icon: 'school' },
              { value: 'personal', label: t('tasks.category.personal'), icon: 'person' },
            ]}
            value={category}
            onChange={(val) => setCategory(val as TaskCategory)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant">
          <div>
            <p className="text-title-md font-medium text-on-surface">{t('tasks.editor.priorityLabel')}</p>
            <p className="text-body-sm text-on-surface-variant">{t('tasks.priority.high')}</p>
          </div>
          <Switch
            checked={priority === 'high'}
            onChange={(checked) => setPriority(checked ? 'high' : 'normal')}
            label={t('tasks.editor.priorityLabel')}
          />
        </div>

        <TagPicker
          label={t('tasks.editor.tagsLabel')}
          selectedIds={tagIds}
          onChange={setTagIds}
        />

        <TextArea
          label={t('tasks.editor.notesLabel')}
          placeholder={t('tasks.editor.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          error={formatError(errors.notes, t('tasks.editor.notesLabel'))}
        />
      </form>
    </Dialog>
  );
}
