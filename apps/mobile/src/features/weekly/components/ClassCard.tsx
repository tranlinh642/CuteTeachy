import { StyleSheet, View } from 'react-native';
import { formatTimeRange, needsPreparation } from '@cute-teachy/core';
import { useTranslation } from '@cute-teachy/i18n';
import type { ClassSession } from '@cute-teachy/types';
import { Card, Chip, Icon, Typography } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';

export interface ClassCardProps {
  readonly session: ClassSession;
}

/** Thẻ tiết dạy (refactor từ molecules/ClassCard). */
export function ClassCard({ session }: ClassCardProps) {
  const { t, localeTag } = useTranslation();
  const palette = tones[session.tone];
  const title = session.grade ? `${session.subject} – ${session.grade}` : session.subject;

  return (
    <Card variant="tonal" tone={session.tone} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.timeChip}>
          <Icon name="clock" size={14} color={palette.fg} />
          <Typography variant="labelMd" color={palette.fg}>
            {formatTimeRange(session.startTime, session.endTime, localeTag)}
          </Typography>
        </View>
      </View>
      <Typography variant="titleLg" color={palette.fg}>
        {title}
      </Typography>
      <Typography variant="bodySm" color={colors.onSurfaceVariant}>
        {session.room}
        {session.topic ? ` · ${t('weekly.topic')}: ${session.topic}` : ''}
      </Typography>
      {needsPreparation(session) ? (
        <View style={styles.footer}>
          <Chip label={t('weekly.prepNeeded')} icon="checklist" />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[1.5],
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing[1],
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing[1],
  },
});
