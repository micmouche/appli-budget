/**
 * Fournit le thème (couleurs, espacement, typographie) à toute l'app.
 * Le schéma suit le système sauf surcharge utilisateur ('light' | 'dark').
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';
import {
  chartPalette,
  darkColors,
  lightColors,
  moduleColors,
  radius,
  spacing,
  type ColorScheme,
  type ColorTokens,
  type ModuleId,
} from './tokens';
import { typeScale } from './typography';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof typeScale;
  chart: readonly string[];
  module: Record<ModuleId, string>;
}

const ThemeContext = createContext<Theme | null>(null);

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    type: typeScale,
    chart: chartPalette[scheme],
    module: moduleColors[scheme],
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const system = useColorScheme();
  const preference = useSettings((s) => s.theme);
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => buildTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme doit être utilisé dans <ThemeProvider>');
  return theme;
}
