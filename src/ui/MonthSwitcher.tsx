/** « ‹ Novembre 2026 › » */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { formatMonthKey } from '@/utils/format';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface MonthSwitcherProps {
  monthKey: string;
  onChange: (next: string) => void;
  shift: (key: string, delta: number) => string;
  canGoForward?: boolean;
}

export function MonthSwitcher({
  monthKey,
  onChange,
  shift,
  canGoForward = true,
}: MonthSwitcherProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <IconButton
        name="ChevronLeft"
        accessibilityLabel="Mois précédent"
        onPress={() => onChange(shift(monthKey, -1))}
      />
      <Text variant="headline" accessibilityRole="header" style={{ flex: 1 }} align="center">
        {formatMonthKey(monthKey)}
      </Text>
      <IconButton
        name="ChevronRight"
        accessibilityLabel="Mois suivant"
        onPress={() => onChange(shift(monthKey, 1))}
        disabled={!canGoForward}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
