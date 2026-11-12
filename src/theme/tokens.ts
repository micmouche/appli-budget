/**
 * Jetons du design system « papier et encre ».
 * Les valeurs sont celles validées dans docs/02-arborescence-et-design-system.md
 * (contrastes WCAG mesurés, palette de graphiques validée daltonisme).
 */

export type ColorScheme = 'light' | 'dark';

export interface ColorTokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  brand: string;
  onBrand: string;
  brandSoft: string;
  positive: string;
  positiveFill: string;
  negative: string;
  warning: string;
  warningFill: string;
  info: string;
  /** Orange chaleureux (accent secondaire). */
  accent: string;
  accentSoft: string;
  /** Lavande (accent tertiaire). */
  lavender: string;
  lavenderSoft: string;
  /** Vert très foncé : barre de navigation basse, grands titres. */
  navBar: string;
  /** Rose des barres de graphique (référence visuelle). */
  chartAccent: string;
  premium: string;
  premiumBg: string;
  overlay: string;
}

export const lightColors: ColorTokens = {
  bg: '#F6F5EF',
  surface: '#FFFFFF',
  surface2: '#E6EEEA',
  border: '#E6E3DB',
  text: '#1E3A34',
  textSecondary: '#5F6A67',
  textMuted: '#8C9490',
  brand: '#1E7B5E',
  onBrand: '#FFFFFF',
  brandSoft: '#E4EEEA',
  positive: '#176B58',
  positiveFill: '#1F8A6A',
  negative: '#C8403A',
  warning: '#96620A',
  warningFill: '#E6A23C',
  info: '#2F6BBF',
  accent: '#E67B45',
  accentSoft: '#FBE9DF',
  lavender: '#7764D8',
  lavenderSoft: '#ECE8FB',
  navBar: '#1D463C',
  chartAccent: '#E0245E',
  premium: '#8A6A1E',
  premiumBg: '#F5ECD3',
  overlay: 'rgba(23, 25, 29, 0.45)',
};

export const darkColors: ColorTokens = {
  bg: '#0F1114',
  surface: '#171A1F',
  surface2: '#1F232A',
  border: '#2A2F37',
  text: '#F2F1EC',
  textSecondary: '#A0A6B1',
  textMuted: '#6E7480',
  brand: '#6FCBA6',
  onBrand: '#0F1114',
  brandSoft: '#1C332B',
  positive: '#4CC38A',
  positiveFill: '#4CC38A',
  negative: '#F0766F',
  warning: '#E0A93A',
  warningFill: '#E0A93A',
  info: '#6FA3EE',
  accent: '#F09A6C',
  accentSoft: '#3A271D',
  lavender: '#A394F0',
  lavenderSoft: '#272342',
  navBar: '#0B1F1A',
  chartAccent: '#F0567F',
  premium: '#E8C66B',
  premiumBg: '#2E2714',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

/** Couleur d'identité de chaque module. */
export const moduleColors: Record<ColorScheme, Record<ModuleId, string>> = {
  light: { budget: '#2F6BBF', savings: '#1E9E78', property: '#D9712E', rental: '#6B5BD2', works: '#D8A118' },
  dark: { budget: '#4F8BE0', savings: '#2BA37E', property: '#D96B2E', rental: '#9085E9', works: '#B88412' },
};

export type ModuleId = 'budget' | 'savings' | 'property' | 'rental' | 'works';

/**
 * Palette catégorielle des graphiques : 8 crans en ordre FIXE, attribués à la
 * catégorie (jamais à son rang). Validée avec le script dataviz en clair (#FFFFFF)
 * et en sombre (#171A1F).
 */
export const chartPalette: Record<ColorScheme, readonly string[]> = {
  light: ['#2F6BBF', '#D9712E', '#1E9E78', '#D8A118', '#C25A8A', '#2E7D32', '#6B5BD2', '#C8403A'],
  dark: ['#4F8BE0', '#D96B2E', '#2BA37E', '#B88412', '#D0659A', '#3E9A44', '#9085E9', '#E35F5A'],
};

/** Couleurs proposées pour une catégorie personnalisée (index dans chartPalette). */
export const CATEGORY_COLOR_COUNT = 8;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  full: 999,
} as const;

export const screenPadding = spacing[5];
export const cardGap = spacing[3];
export const touchTarget = 44;

/** Durées d'animation (ms). */
export const motion = {
  fast: 120,
  base: 250,
  slow: 400,
} as const;
