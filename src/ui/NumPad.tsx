/** Pavé numérique personnalisé : chiffres, virgule, 00, effacer ; haptique à chaque touche. */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { haptics } from '@/utils/haptics';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';
import { applyKey } from './numpadLogic';

export { applyKey };

export interface NumPadProps {
  value: string;
  onChange: (next: string) => void;
  maxDecimals?: number;
  maxIntegerDigits?: number;
}

const KEYS: (string | 'back')[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];

export function NumPad({
  value,
  onChange,
  maxDecimals = 2,
  maxIntegerDigits = 7,
}: NumPadProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.grid} accessibilityRole="keyboardkey">
      {KEYS.map((key) => (
        <PressableScale
          key={key}
          scaleTo={0.92}
          accessibilityRole="button"
          accessibilityLabel={key === 'back' ? 'Effacer' : key === ',' ? 'Virgule' : key}
          onPress={() => {
            haptics.selection();
            onChange(applyKey(value, key, maxDecimals, maxIntegerDigits));
          }}
          onLongPress={key === 'back' ? () => onChange('') : undefined}
          style={[styles.key, { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.sm }]}
        >
          {key === 'back' ? (
            <Icon name="Delete" size={24} color="text" />
          ) : (
            <Text variant="title2">{key}</Text>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { width: '31.5%', flexGrow: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
});
