import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, spacing } from '@/theme';
import { Typography } from '../ui/Typography';

export interface AppHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  /** Nút trái: quay lại, menu… */
  readonly leading?: ReactNode;
  /** Bên phải: avatar, IconButton… */
  readonly trailing?: ReactNode;
  /** `center`: tiêu đề giữa (màn hình tab); `start`: tiêu đề lớn căn trái. */
  readonly align?: 'center' | 'start';
  readonly style?: StyleProp<ViewStyle>;
}

const SLOT_WIDTH = layout.minTouchTarget;

export function AppHeader({ title, subtitle, leading, trailing, align = 'center', style }: AppHeaderProps) {
  const centered = align === 'center';

  return (
    <View style={[styles.row, style]}>
      {centered || leading ? <View style={styles.slot}>{leading}</View> : null}
      <View style={[styles.titleBlock, centered && styles.titleCentered]}>
        <Typography
          variant={centered ? 'titleLg' : 'displayMd'}
          color={centered ? colors.primary : colors.onSurface}
          accessibilityRole="header"
          numberOfLines={centered ? 1 : 2}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodySm" color={colors.onSurfaceVariant}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <View style={[styles.slot, styles.slotEnd]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.topbarHeight - 8,
    paddingHorizontal: layout.containerPadding - spacing[2],
    gap: spacing[2],
  },
  slot: {
    minWidth: SLOT_WIDTH,
    alignItems: 'flex-start',
  },
  slotEnd: {
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
    paddingLeft: spacing[2],
  },
  titleCentered: {
    alignItems: 'center',
    paddingLeft: 0,
  },
});
