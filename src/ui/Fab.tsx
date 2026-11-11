/** Bouton flottant 56 pt, ombre douce teintée brand. */
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';

export interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: string;
  bottomOffset?: number;
}

export const FAB_SIZE = 56;

export function Fab({
  onPress,
  accessibilityLabel,
  icon = 'Plus',
  bottomOffset = 0,
}: FabProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fab,
        {
          backgroundColor: theme.colors.brand,
          bottom: insets.bottom + bottomOffset + theme.spacing[4],
          right: theme.spacing[5],
          shadowColor: theme.colors.brand,
        },
      ]}
    >
      <Icon name={icon} color={theme.colors.onBrand} size={28} strokeWidth={2.25} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
});
