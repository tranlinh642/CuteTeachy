import { StyleSheet, View } from 'react-native';
import { checklistProgress, formatShortDate } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ID, Note, Tag } from '@cute-teachy/types';
import { Card, Checkbox, Chip, IconButton, TagChip, Typography } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';

export interface NoteCardProps {
  readonly note: Note;
  readonly tags?: readonly Tag[];
  readonly onToggleItem?: (note: Note, itemId: ID) => void;
  readonly onEdit?: (note: Note) => void;
  readonly onDelete?: (note: Note) => void;
}

export function NoteCard({ note, tags = [], onToggleItem, onEdit, onDelete }: NoteCardProps) {
  const { t, localeTag } = useTranslation();
  const { done, total } = checklistProgress(note);

  return (
    <Card style={styles.card}>
      {/* Header: Title + Due Date chip + Actions */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Typography variant="titleMd" numberOfLines={2}>
            {note.title}
          </Typography>
          {note.dueDate ? (
            <Typography variant="labelSm" color={colors.primary}>
              {t('weekly.dueAt', { time: formatShortDate(new Date(note.dueDate), localeTag) })}
            </Typography>
          ) : null}
        </View>

        <View style={styles.actions}>
          {total > 0 ? (
            <Chip
              label={`${done}/${total}`}
              icon="checklist"
              style={styles.progressChip}
            />
          ) : null}
          {onEdit ? (
            <IconButton
              icon="edit"
              iconSize={18}
              accessibilityLabel={`${t('common.actions.edit')}: ${note.title}`}
              onPress={() => onEdit(note)}
            />
          ) : null}
          {onDelete ? (
            <IconButton
              icon="delete"
              iconSize={18}
              color={colors.error}
              accessibilityLabel={`${t('common.actions.delete')}: ${note.title}`}
              onPress={() => onDelete(note)}
            />
          ) : null}
        </View>
      </View>

      {/* Content nếu là ghi chú văn bản thuần */}
      {note.content ? (
        <Typography variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={4}>
          {note.content}
        </Typography>
      ) : null}

      {/* Checklist items nếu có */}
      {total > 0 ? (
        <View style={styles.checklist}>
          {note.checklist.map((item) => (
            <View key={item.id} style={styles.checkItem}>
              <Checkbox
                checked={item.done}
                onChange={() => onToggleItem?.(note, item.id)}
                accessibilityLabel={item.text}
              />
              <Typography
                variant="bodySm"
                style={[styles.itemText, item.done && styles.lineThrough]}
                numberOfLines={2}
              >
                {item.text}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}

      {/* Thẻ tags */}
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  titleArea: {
    flex: 1,
    gap: spacing[0.5],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  progressChip: {
    marginRight: spacing[1],
  },
  checklist: {
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemText: {
    flex: 1,
  },
  lineThrough: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
});
