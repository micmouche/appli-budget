/** Icône de catégorie : carré arrondi teinté + pictogramme de la couleur de la catégorie. */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';

export interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  /** Fond plein (icône blanche) au lieu du fond pastel. */
  solid?: boolean;
}

export function CategoryIcon({ icon, color, size = 40, solid = false }: CategoryIconProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: solid ? color : `${color}1F`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} color={solid ? theme.colors.onBrand : color} size={Math.round(size * 0.5)} strokeWidth={2} />
    </View>
  );
}
