/**
 * Theme mobile = design tokens dùng chung (`@cute-teachy/tokens`) + mapping sang React Native.
 * Component chỉ import từ `@/theme`, không hard-code màu/kích thước.
 */
export {
  colors,
  tones,
  toneNames,
  spacing,
  layout,
  radius,
  motion,
  zIndex,
  type ColorToken,
  type Tone,
  type RadiusToken,
  type SpacingToken,
  type ShadowLevel,
} from '@cute-teachy/tokens';
export * from './typography';
export * from './shadows';
