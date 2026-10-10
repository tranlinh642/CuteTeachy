import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LIMITS } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import { Button, SheetSurface, TextField, Typography } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useTagForm } from '../hooks/use-tag-form';
import { ToneSwatches } from './ToneSwatches';

/** Route modal "Tạo thẻ mới" – đóng và quay lại form trước sau khi tạo. */
export function NewTagScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useTagForm(() => router.back());

  return (
    <SheetSurface
      title={t('tags.editor.title')}
      onClose={() => router.back()}
      placement="center"
      footer={
        <>
          <Button title={t('common.actions.cancel')} variant="ghost" onPress={() => router.back()} style={styles.action} />
          <Button
            title={t('tags.editor.submit')}
            onPress={form.submit}
            loading={form.isSubmitting}
            style={styles.action}
          />
        </>
      }
    >
      <TextField
        label={t('tags.editor.nameLabel')}
        placeholder={t('tags.editor.namePlaceholder')}
        value={form.values.name}
        onChangeText={form.setName}
        error={form.nameError}
        maxLength={LIMITS.tagNameMax}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={form.submit}
      />
      <View style={styles.section}>
        <Typography variant="labelMd" color={colors.onSurfaceVariant}>
          {t('tags.editor.colorLabel')}
        </Typography>
        <ToneSwatches value={form.values.tone} onChange={form.setTone} />
      </View>
      {form.submitError ? (
        <Typography variant="bodySm" color={colors.error}>
          {form.submitError}
        </Typography>
      ) : null}
    </SheetSurface>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  section: {
    gap: spacing[2],
  },
});
