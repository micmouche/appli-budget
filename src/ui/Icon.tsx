/** Icône Lucide résolue par son nom (stockable en base) avec couleur de thème. */
import React from 'react';
import * as Icons from 'lucide-react-native';
import type { LucideIcon, LucideProps } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type IconName = keyof typeof Icons;

export interface IconProps extends Omit<LucideProps, 'color'> {
  name: string;
  color?: keyof ColorTokens | string;
  size?: number;
}

const FALLBACK: LucideIcon = Icons.CircleEllipsis;

export function resolveIcon(name: string): LucideIcon {
  const candidate = (Icons as unknown as Record<string, unknown>)[name];
  return typeof candidate === 'function' || (candidate && typeof candidate === 'object')
    ? (candidate as LucideIcon)
    : FALLBACK;
}

export function Icon({
  name,
  color = 'text',
  size = 24,
  strokeWidth = 1.75,
  ...rest
}: IconProps): React.JSX.Element {
  const theme = useTheme();
  const resolved = (theme.colors as unknown as Record<string, string>)[color] ?? color;
  return React.createElement(resolveIcon(name), { color: resolved, size, strokeWidth, ...rest });
}
