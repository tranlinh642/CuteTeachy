import { colors, shadows, type ShadowLevel } from '@cute-teachy/tokens';
import type { ViewStyle } from 'react-native';

/** Token shadow → iOS shadow* + Android elevation (màu cocoa, không dùng đen). */
const toShadowStyle = (level: ShadowLevel): ViewStyle => {
  const token = shadows[level];
  return {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: token.offsetY },
    shadowOpacity: token.opacity,
    shadowRadius: token.blur / 2,
    elevation: token.elevation,
  };
};

export const shadowStyles: Readonly<Record<ShadowLevel, ViewStyle>> = {
  sm: toShadowStyle('sm'),
  md: toShadowStyle('md'),
  lg: toShadowStyle('lg'),
};
