import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@cute-teachy/tokens';
import { colors, radius, spacing, tones, type Tone } from '@/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface ChipProps {
  readonly label: string;
  /** Màu pastel ngữ nghĩa; mặc định là surface trung tính. */
  readonly tone?: Tone;
  readonly icon?: IconName;
  /** Chip lọc / chọn: hiển thị viền đậm khi được chọn. */
  readonly selected?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const CHIP_HEIGHT = 32;
/** Mở rộng vùng chạm của chip 32px lên ≥ 44px. */
const HIT_SLOP = { top: 6, bottom: 6, left: 2, right: 2 } as const;

export function Chip({ label, tone, icon, selected = false, onPress, accessibilityLabel, style }: ChipProps) {
  const palette = tone
    ? tones[tone]
    : { bg: colors.surfaceContainerHigh, fg: colors.onSurfaceVariant, accent: colors.outline };

  const content = (
    <>
      {icon ? <Icon name={icon} size={16} color={palette.fg} /> : null}
      <Typography variant="labelMd" color={palette.fg} numberOfLines={1}>
        {label}
      </Typography>
    </>
  );

  const chipStyle = [
    styles.base,
    { backgroundColor: palette.bg, borderColor: selected ? palette.accent : 'transparent' },
    style,
  ];

  if (!onPress) {
    return <View style={chipStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [chipStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // ôm vừa nội dung nhãn
    gap: spacing[1],
  },
  pressed: {
    opacity: 0.8,
  },
});
