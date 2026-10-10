import { StyleSheet, View } from 'react-native';
import { formatTime } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { Tag, Task } from '@cute-teachy/types';
import { Checkbox, IconButton, TagChip, Typography } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';

export interface TaskItemProps {
  readonly task: Task;
  /** Thẻ đã resolve (tùy chọn). */
  readonly tags?: readonly Tag[];
  readonly onToggle: (task: Task) => void;
  readonly onEdit?: (task: Task) => void;
  readonly onDelete?: (task: Task) => void;
}

/** Thẻ công việc cá nhân (design: Personal To-Dos). */
export function TaskItem({ task, tags = [], onToggle, onEdit, onDelete }: TaskItemProps) {
  const { t, localeTag } = useTranslation();
  const subtitle = task.time ? t('weekly.dueAt', { time: formatTime(task.time, localeTag) }) : task.notes;
  const palette = task.priority === 'high' ? tones.rose : tones.pink;

  return (
    <View style={[styles.card, { backgroundColor: palette.bg }, task.completed && styles.completed]}>
      <Checkbox
        checked={task.completed}
        onChange={() => onToggle(task)}
        accessibilityLabel={
          task.completed ? t('tasks.markUndone', { title: task.title }) : t('tasks.markDone', { title: task.title })
        }
      />
      <View style={styles.body}>
        <Typography
          variant="titleMd"
          color={palette.fg}
          style={task.completed && styles.lineThrough}
          numberOfLines={2}
        >
          {task.title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        {onEdit ? (
          <IconButton
            icon="edit"
            iconSize={20}
            accessibilityLabel={`${t('common.actions.edit')}: ${task.title}`}
            onPress={() => onEdit(task)}
          />
        ) : null}
        {onDelete ? (
          <IconButton
            icon="delete"
            iconSize={20}
            color={colors.error}
            accessibilityLabel={`${t('common.actions.delete')}: ${task.title}`}
            onPress={() => onDelete(task)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    paddingVertical: spacing[2],
    paddingLeft: spacing[1],
    paddingRight: spacing[1],
  },
  completed: {
    opacity: 0.65,
  },
  body: {
    flex: 1,
    paddingTop: spacing[3],
    gap: spacing[1],
  },
  lineThrough: {
    textDecorationLine: 'line-through', // gạch ngang khi đã hoàn thành
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  actions: {
    flexDirection: 'row',
  },
});
