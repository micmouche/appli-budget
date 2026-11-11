/** Bouton icône, cible tactile de 44 pt minimum. */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { touchTarget } from '@/theme/tokens';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';

export interface IconButtonProps {
  name: string;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = 'text',
  size = 24,
  filled = false,
  style,
  disabled,
}: IconButtonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={[
        {
          width: touchTarget,
          height: touchTarget,
          borderRadius: theme.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? theme.colors.surface2 : 'transparent',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} color={color} size={size} />
    </PressableScale>
  );
}
