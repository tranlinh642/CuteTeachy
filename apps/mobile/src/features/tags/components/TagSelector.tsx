import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTags } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import type { ID } from '@cute-teachy/types';
import { Chip, TagChip, Typography } from '@/components/ui';
import { ROUTES } from '@/lib/routes';
import { colors, spacing } from '@/theme';

export interface TagSelectorProps {
  readonly label: string;
  readonly selectedIds: readonly ID[];
  readonly onChange: (ids: ID[]) => void;
}

/** Chọn nhiều thẻ cho công việc / ghi chú; chip "+" mở modal tạo thẻ. */
export function TagSelector({ label, selectedIds, onChange }: TagSelectorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: tags = [] } = useTags();

  const toggle = (id: ID) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);

  return (
    <View style={styles.container}>
      <Typography variant="labelMd" color={colors.onSurfaceVariant}>
        {label}
      </Typography>
      <View style={styles.chips}>
        {tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} selected={selectedIds.includes(tag.id)} onPress={() => toggle(tag.id)} />
        ))}
        <Chip label={t('tags.editor.title')} icon="add" onPress={() => router.push(ROUTES.newTag)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
});
