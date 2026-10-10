import { StyleSheet, View } from 'react-native';
import { LIMITS } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ISODate, Task, TaskCategory } from '@cute-teachy/types';
import { DateField, TimeField } from '@/components/pickers';
import { Button, SegmentedControl, SheetSurface, Switch, TextArea, TextField, Typography } from '@/components/ui';
import { TagSelector } from '@/features/tags';
import { colors, spacing } from '@/theme';
import { useTaskForm } from '../hooks/use-task-form';

export interface TaskFormProps {
  readonly initialTask?: Task;
  readonly defaultDate?: ISODate;
  readonly onClose: () => void;
}

/** Bottom sheet "Công việc mới" (design: Add Task Modal). */
export function TaskForm({ initialTask, defaultDate, onClose }: TaskFormProps) {
  const { t } = useTranslation();
  const form = useTaskForm({ initialTask, defaultDate, onDone: onClose });

  const categoryOptions = [
    { value: 'school' as const, label: t('tasks.category.school'), icon: 'school' as const },
    { value: 'personal' as const, label: t('tasks.category.personal'), icon: 'person' as const },
  ];

  return (
    <SheetSurface
      title={form.isEditing ? t('tasks.editor.editTitle') : t('tasks.editor.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button title={t('common.actions.cancel')} variant="ghost" onPress={onClose} style={styles.action} />
          <Button
            title={t('tasks.editor.save')}
            onPress={form.submit}
            loading={form.isSubmitting}
            style={styles.action}
          />
        </>
      }
    >
      <TextField
        label={t('tasks.editor.nameLabel')}
        placeholder={t('tasks.editor.namePlaceholder')}
        icon="edit"
        value={form.values.title}
        onChangeText={(text) => form.setField('title', text)}
        error={form.errors.title}
        maxLength={LIMITS.titleMax}
        autoFocus={!form.isEditing}
        returnKeyType="next"
      />

      <View style={styles.row}>
        <DateField
          label={t('tasks.editor.dateLabel')}
          value={form.values.date}
          onChange={(date) => form.setField('date', date)}
          error={form.errors.date}
          style={styles.flex}
        />
        <TimeField
          label={t('tasks.editor.timeLabel')}
          value={form.values.time}
          onChange={(time) => form.setField('time', time)}
          error={form.errors.time}
          style={styles.flex}
        />
      </View>

      <View style={styles.section}>
        <Typography variant="labelMd" color={colors.onSurfaceVariant}>
          {t('tasks.editor.categoryLabel')}
        </Typography>
        <SegmentedControl<TaskCategory>
          options={categoryOptions}
          value={form.values.category}
          onChange={(category) => form.setField('category', category)}
          accessibilityLabel={t('tasks.editor.categoryLabel')}
        />
      </View>

      <View style={styles.switchRow}>
        <Typography variant="bodyLg">{t('tasks.editor.priorityLabel')}</Typography>
        <Switch
          value={form.values.priority === 'high'}
          onValueChange={(high) => form.setField('priority', high ? 'high' : 'normal')}
          accessibilityLabel={t('tasks.editor.priorityLabel')}
        />
      </View>

      <TagSelector
        label={t('tasks.editor.tagsLabel')}
        selectedIds={form.values.tagIds ?? []}
        onChange={(tagIds) => form.setField('tagIds', tagIds)}
      />

      <TextArea
        label={t('tasks.editor.notesLabel')}
        placeholder={t('tasks.editor.notesPlaceholder')}
        value={form.values.notes ?? ''}
        onChangeText={(text) => form.setField('notes', text)}
        error={form.errors.notes}
        maxLength={LIMITS.notesMax}
      />

      {form.submitError ? (
        <Typography variant="bodySm" color={colors.error} accessibilityLiveRegion="polite">
          {form.submitError}
        </Typography>
      ) : null}
    </SheetSurface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
  },
  section: {
    gap: spacing[2],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    flex: 1,
  },
});
