/**
 * Échelle typographique : Plus Jakarta Sans (titres, chiffres héros) + Inter (corps, listes).
 * Les chiffres utilisent les variantes tabulaires pour aligner les montants.
 */
import type { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'PlusJakartaSans_800ExtraBold',
  displaySemi: 'PlusJakartaSans_700Bold',
  displayMedium: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export type TypeStyle =
  | 'hero'
  | 'display'
  | 'title1'
  | 'title2'
  | 'headline'
  | 'body'
  | 'callout'
  | 'caption'
  | 'micro';

export const typeScale: Record<TypeStyle, TextStyle> = {
  hero: { fontFamily: fontFamilies.display, fontSize: 44, lineHeight: 50, letterSpacing: -1.5 },
  display: { fontFamily: fontFamilies.display, fontSize: 34, lineHeight: 40, letterSpacing: -1 },
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
  hero: 1.1,
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
