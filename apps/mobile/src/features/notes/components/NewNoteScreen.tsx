import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import type { ID } from '@cute-teachy/types';
import { AppHeader, ScreenContainer } from '@/components/layout';
import { DateField } from '@/components/pickers';
import {
  Button,
  Card,
  Checkbox,
  IconButton,
  TextArea,
  TextField,
  Typography,
} from '@/components/ui';
import { TagSelector } from '@/features/tags';
import { translateFieldError } from '@/lib/field-error';
import { colors, spacing } from '@/theme';
import { useNoteForm } from '../hooks/use-note-form';

export interface NewNoteScreenProps {
  readonly id?: ID;
}

export function NewNoteScreen({ id }: NewNoteScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    isEdit,
    title,
    setTitle,
    content,
    setContent,
    checklist,
    newChecklistText,
    setNewChecklistText,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
    tagIds,
    setTagIds,
    dueDate,
    setDueDate,
    errors,
    isSubmitting,
    submit,
  } = useNoteForm({ id });

  return (
    <ScreenContainer
      header={
        <AppHeader
          title={isEdit ? t('notes.editor.editTitle') : t('notes.editor.createTitle')}
          leading={
            <IconButton
              icon="arrowBack"
              accessibilityLabel={t('common.actions.back')}
              onPress={() => router.back()}
            />
          }
        />
      }
    >
      <View style={styles.form}>
        {/* Tiêu đề ghi chú */}
        <TextField
          label={t('notes.editor.titleLabel')}
          placeholder={t('notes.editor.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          error={translateFieldError(t, errors.title, 'notes.editor.titleLabel')}
        />

        {/* Nội dung chi tiết */}
        <TextArea
          label={t('notes.editor.contentLabel')}
          placeholder={t('notes.editor.contentPlaceholder')}
          value={content}
          onChangeText={setContent}
          error={translateFieldError(t, errors.content, 'notes.editor.contentLabel')}
        />

        {/* Mục kiểm tra (Checklist) */}
        <Card style={styles.checklistCard}>
          <Typography variant="titleMd">{t('notes.editor.checklistLabel')}</Typography>

          <View style={styles.addChecklistRow}>
            <TextField
              containerStyle={styles.flex}
              placeholder={t('notes.editor.checklistItemPlaceholder')}
              value={newChecklistText}
              onChangeText={setNewChecklistText}
              onSubmitEditing={addChecklistItem}
              returnKeyType="done"
            />
            <IconButton
              icon="add"
              accessibilityLabel={t('notes.editor.addChecklistItem')}
              onPress={addChecklistItem}
            />
          </View>

          {checklist.map((item) => (
            <View key={item.id} style={styles.checkItemRow}>
              <Checkbox
                checked={item.done}
                onChange={() => toggleChecklistItem(item.id)}
                accessibilityLabel={item.text}
              />
              <Typography
                variant="bodySm"
                style={[styles.flex, item.done && styles.lineThrough]}
              >
                {item.text}
              </Typography>
              <IconButton
                icon="delete"
                iconSize={18}
                color={colors.error}
                accessibilityLabel={t('common.actions.delete')}
                onPress={() => removeChecklistItem(item.id)}
              />
            </View>
          ))}
        </Card>

        {/* Chọn nhãn tags */}
        <TagSelector
          label={t('notes.editor.tagsLabel')}
          selectedIds={tagIds}
          onChange={setTagIds}
        />

        {/* Ngày đến hạn (tùy chọn) */}
        <DateField
          label={t('tasks.editor.dateLabel')}
          value={dueDate}
          onChange={setDueDate}
        />

        {/* Nút lưu */}
        <Button
          title={t('notes.editor.save')}
          loading={isSubmitting}
          onPress={submit}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[5],
  },
  checklistCard: {
    gap: spacing[3],
    padding: spacing[4],
  },
  addChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  flex: {
    flex: 1,
  },
  lineThrough: {
    textDecorationLine: 'line-through',
    color: colors.onSurfaceVariant,
  },
});
