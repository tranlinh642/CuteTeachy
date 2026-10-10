import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { typography, type FontWeight, type TypographyVariant } from '@cute-teachy/tokens';
import type { TextStyle } from 'react-native';

/**
 * Font assets cho `useFonts` – key chính là tên fontFamily dùng trong style.
 * Mỗi weight là một file riêng nên KHÔNG dùng `fontWeight` (Android sẽ fallback).
 */
export const fontAssets = {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} as const;

export type FontFamilyName = keyof typeof fontAssets;

export const fontFamilyByWeight: Readonly<Record<FontWeight, FontFamilyName>> = {
  '400': 'Quicksand_400Regular',
  '500': 'Quicksand_500Medium',
  '600': 'Quicksand_600SemiBold',
  '700': 'Quicksand_700Bold',
};

const toTextStyle = (variant: TypographyVariant): TextStyle => {
  const token = typography[variant];
  return {
    fontFamily: fontFamilyByWeight[token.fontWeight],
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
  };
};

/** Token typography → React Native `TextStyle`. */
export const textVariants = Object.fromEntries(
  (Object.keys(typography) as TypographyVariant[]).map((variant) => [variant, toTextStyle(variant)]),
) as Readonly<Record<TypographyVariant, TextStyle>>;

export type { TypographyVariant };
