import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, spacing } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface SectionHeaderProps {
  readonly title: string;
  readonly icon?: IconName;
  /** Phần tử bên phải: nút "Xem tất cả", IconButton… */
  readonly trailing?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, icon, trailing, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleRow}>
        {icon ? <Icon name={icon} size={24} color={colors.primary} /> : null}
        <Typography variant="titleLg" accessibilityRole="header">
          {title}
        </Typography>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexShrink: 1,
  },
});
