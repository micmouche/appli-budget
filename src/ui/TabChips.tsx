/** Onglets internes d'un écran : rangée de puces défilante, toujours toutes visibles ou atteignables. */
import React from 'react';
import { ScrollView } from 'react-native';

import { screenPadding } from '@/theme/tokens';

import { Chip } from './Chip';

export interface TabChipsProps<T extends string> {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function TabChips<T extends string>({ options, value, onChange }: TabChipsProps<T>): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -screenPadding }} contentContainerStyle={{ paddingHorizontal: screenPadding, gap: 8 }} accessibilityRole="tablist">
      {options.map((o) => (
        <Chip key={o.value} label={o.label} icon={o.icon} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}
