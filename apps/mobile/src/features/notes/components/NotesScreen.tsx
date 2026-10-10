import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { ScreenContainer } from '@/components/layout';
import { Chip, EmptyState, Fab, TagChip, TextField, Typography } from '@/components/ui';
import { ROUTES } from '@/lib/routes';
import { spacing } from '@/theme';
import { useNotesList } from '../hooks/use-notes-list';
import { NoteCard } from './NoteCard';

export function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    query,
    setQuery,
    selectedTagId,
    setSelectedTagId,
    tags,
    notes,
    tagsFor,
    toggleChecklistItem,
    deleteNote,
    isLoading,
    refetch,
  } = useNotesList();

  return (
    <ScreenContainer
      refreshing={isLoading}
      onRefresh={refetch}
      overlay={
        <Fab
          icon="add"
          accessibilityLabel={t('notes.editor.createTitle')}
          onPress={() => router.push(ROUTES.newNote)}
        />
      }
    >
      {/* Tiêu đề & Ô tìm kiếm */}
      <View style={styles.header}>
        <Typography variant="displayLg">{t('notes.title')}</Typography>
        <TextField
          icon="search"
          placeholder={t('notes.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          accessibilityLabel={t('notes.searchPlaceholder')}
        />
      </View>

      {/* Dải bộ lọc Thẻ (Tag Filter) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagFilters}
      >
        <Chip
          label={t('notes.filterAll')}
          selected={selectedTagId === null}
          onPress={() => setSelectedTagId(null)}
        />
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            selected={selectedTagId === tag.id}
            onPress={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
          />
        ))}
      </ScrollView>

      {/* Danh sách ghi chú */}
      {notes.length === 0 ? (
        <EmptyState
          icon="notes"
          title={t('notes.empty')}
        />
      ) : (
        <View style={styles.notesList}>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              tags={tagsFor(note.tagIds)}
              onToggleItem={toggleChecklistItem}
              onEdit={(n) => router.push({ pathname: ROUTES.newNote, params: { id: n.id } })}
              onDelete={(n) => deleteNote(n.id)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  tagFilters: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  notesList: {
    gap: spacing[4],
  },
});
