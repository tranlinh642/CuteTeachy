import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconName;
  /** Thường là một `Button` (Thử lại, Tạo mới…). */
  readonly action?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function EmptyState({ title, description, icon = 'spa', action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={28} color={colors.primary} />
      </View>
      <Typography variant="bodyLg" align="center" color={colors.onSurface}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="bodySm" align="center" color={colors.onSurfaceVariant}>
          {description}
        </Typography>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
});
