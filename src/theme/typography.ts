/**
 * Échelle typographique : Manrope (titres, chiffres héros) + Inter (corps, listes).
 * Les chiffres utilisent les variantes tabulaires pour aligner les montants.
 */
import type { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'Manrope_700Bold',
  displaySemi: 'Manrope_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export type TypeStyle =
  | 'display'
  | 'title1'
  | 'title2'
  | 'headline'
  | 'body'
  | 'callout'
  | 'caption'
  | 'micro';

export const typeScale: Record<TypeStyle, TextStyle> = {
  display: { fontFamily: fontFamilies.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  title1: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  title2: { fontFamily: fontFamilies.displaySemi, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  headline: { fontFamily: fontFamilies.bodySemi, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamilies.body, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: fontFamilies.bodyMedium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 18 },
  micro: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};

/** Plafond de mise à l'échelle des polices (accessibilité) par style. */
export const maxFontScale: Record<TypeStyle, number> = {
  display: 1.4,
  title1: 1.6,
  title2: 1.6,
  headline: 2,
  body: 2,
  callout: 2,
  caption: 2,
  micro: 1.6,
};

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };
