/** Ligne de résultat « libellé … valeur » pour les simulateurs. */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/ui/Text';

export function ResultRow({
  label,
  value,
  strong,
  tone,
  last,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  tone?: string;
  last?: boolean;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
      ]}
    >
      <Text
        variant={strong ? 'headline' : 'callout'}
        color={strong ? 'text' : 'textSecondary'}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant={strong ? 'headline' : 'callout'} tabular color={tone ?? 'text'}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
});
