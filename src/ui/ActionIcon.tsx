/** Action secondaire (référence) : pastille verte ronde + libellé gras sur deux lignes. */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface ActionIconProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export function ActionIcon({ icon, label, onPress }: ActionIconProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} haptic="light" accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', gap: 8, minWidth: 96 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} color={theme.colors.onBrand} size={18} strokeWidth={2.5} />
      </View>
      <Text variant="headline" align="center">
        {label}
      </Text>
    </PressableScale>
  );
}
