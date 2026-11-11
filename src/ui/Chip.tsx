/** Puce sélectionnable (filtres, choix courts). */
import React from 'react';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
}

export function Chip({ label, selected = false, onPress, icon, color }: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const accent = color ?? theme.colors.brand;
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing[3],
        height: 36,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: selected ? accent : theme.colors.border,
        backgroundColor: selected ? (color ? `${color}22` : theme.colors.brandSoft) : theme.colors.surface,
      }}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? accent : theme.colors.textSecondary} /> : null}
      <Text variant="callout" color={selected ? accent : 'textSecondary'}>
        {label}
      </Text>
    </PressableScale>
  );
}
