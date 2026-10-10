import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';
import { Typography } from './Typography';

export interface AvatarProps {
  readonly name: string;
  readonly uri?: string;
  readonly size?: number;
  /** Nhãn đã dịch, ví dụ t('common.a11y.avatar', { name }). */
  readonly accessibilityLabel: string;
  readonly onPress?: () => void;
  /** Viền pastel bao quanh (màn hình Profile). */
  readonly ring?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export function Avatar({ name, uri, size = 44, accessibilityLabel, onPress, ring = false, style }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  const body = (
    <View
      style={[styles.base, dimension, ring && styles.ring, !onPress && style]}
      accessible={!onPress}
      accessibilityRole={onPress ? undefined : 'image'}
      accessibilityLabel={onPress ? undefined : accessibilityLabel}
    >
      {uri ? (
        <Image source={{ uri }} style={dimension} contentFit="cover" />
      ) : (
        <Typography variant={size >= 72 ? 'headlineMd' : 'bodyLg'} color={colors.onPrimaryContainer}>
          {getInitials(name)}
        </Typography>
      )}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 4,
    borderColor: colors.primaryFixed,
  },
  pressable: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
