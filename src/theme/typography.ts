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
  display: { fontFamily: fontFamilies.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  title1: { fontFamily: fontFamilies.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  title2: { fontFamily: fontFamilies.displaySemi, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  headline: { fontFamily: fontFamilies.bodySemi, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fontFamilies.bodyMedium, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 17 },
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
  display: 1.15,
  title1: 1.2,
  title2: 1.25,
  headline: 1.35,
  body: 1.4,
  callout: 1.35,
  caption: 1.35,
  micro: 1.2,
};

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };
