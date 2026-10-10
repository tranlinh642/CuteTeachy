import { StyleSheet, View } from 'react-native';
import { useTodayInspiration } from '@cute-teachy/api';
import { useTranslation } from '@cute-teachy/i18n';
import { Card, Icon, Typography } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';

export function InspirationCard() {
  const { t, locale } = useTranslation();
  const { data: quote, isLoading } = useTodayInspiration();

  if (isLoading || !quote) return null;

  return (
    <Card variant="tonal" tone="beige" style={styles.card}>
      <View style={styles.header}>
        <Icon name="quote" size={16} color={tones.beige.fg} />
        <Typography variant="labelSm" color={tones.beige.fg} style={styles.headerText}>
          {t('home.dailyInspiration')}
        </Typography>
      </View>
      <Typography variant="bodyLg" color={colors.onSurface} style={styles.quote}>
        "{quote.quote[locale]}"
      </Typography>
      {quote.author ? (
        <Typography variant="labelMd" color={colors.onSurfaceVariant} style={styles.author}>
          — {quote.author}
        </Typography>
      ) : null}
      <View style={styles.indicator} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  headerText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quote: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
  author: {
    alignSelf: 'flex-end',
    marginTop: spacing[1],
  },
  indicator: {
    width: 48,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: tones.beige.accent,
    marginTop: spacing[1],
  },
});
