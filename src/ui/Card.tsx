/** Carte : surface bordée, rayon 16, optionnellement pressable. */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './Pressable';

export interface CardProps {
  children: React.ReactNode;
  tone?: 'default' | 'brand' | 'premium' | 'surface2';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  accessibilityLabel?: string;
}

export function Card({
  children,
  tone = 'default',
  onPress,
  style,
  padded = true,
  accessibilityLabel,
}: CardProps): React.JSX.Element {
  const theme = useTheme();
  const background =
    tone === 'brand'
      ? theme.colors.brandSoft
      : tone === 'premium'
        ? theme.colors.premiumBg
        : tone === 'surface2'
          ? theme.colors.surface2
          : theme.colors.surface;
  const base: ViewStyle = {
    backgroundColor: background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: tone === 'default' ? theme.colors.border : 'transparent',
    padding: padded ? theme.spacing[4] : 0,
    overflow: 'hidden',
  };
  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        haptic="light"
        style={[base, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </PressableScale>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
