/**
 * Donut des dépenses par catégorie (Skia via victory-native).
 * Règles dataviz : couleur attribuée à la catégorie (jamais au rang), espace de 2 pt
 * entre segments, légende avec valeurs toujours présente (jamais couleur seule).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

import type { Cents } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCents } from '@/utils/format';
import { percentOf } from '@/finance/money';

import { Text } from '../Text';

export interface DonutSlice {
  id: string;
  label: string;
  value: Cents;
  color: string;
}

export interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Nombre maximal de lignes de légende (le reste est regroupé dans « Autres »). */
  maxLegend?: number;
  otherLabel: string;
  accessibilitySummary?: string;
}

export function DonutChart({
  slices,
  size = 180,
  centerLabel,
  centerValue,
  maxLegend = 6,
  otherLabel,
  accessibilitySummary,
}: DonutChartProps): React.JSX.Element {
  const theme = useTheme();
  const total = slices.reduce((a, s) => a + s.value, 0);
  const sorted = [...slices].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, maxLegend);
  const rest = sorted.slice(maxLegend);
  const data: { id: string; label: string; value: number; color: string }[] = shown.map((s) => ({ ...s }));
  if (rest.length > 0) {
    data.push({
      id: '__other',
      label: otherLabel,
      value: rest.reduce((a, s) => a + s.value, 0),
      color: theme.colors.textMuted,
    });
  }
  const summary =
    accessibilitySummary ?? data.map((d) => `${d.label} ${percentOf(d.value, total)} %`).join(', ');

  return (
    <View style={styles.wrap} accessible accessibilityLabel={summary}>
      <View style={{ width: size, height: size }}>
        {total > 0 ? (
          <PolarChart data={data} labelKey="label" valueKey="value" colorKey="color">
            <Pie.Chart innerRadius="68%">
              {({ slice }) => (
                <>
                  <Pie.Slice animate={{ type: 'timing', duration: 400 }} />
                  <Pie.SliceAngularInset
                    angularInset={{ angularStrokeWidth: 2, angularStrokeColor: theme.colors.surface }}
                  />
                </>
              )}
            </Pie.Chart>
          </PolarChart>
        ) : (
          <View
            style={[
              styles.empty,
              { borderColor: theme.colors.surface2, width: size, height: size, borderRadius: size / 2 },
            ]}
          />
        )}
        <View style={styles.center} pointerEvents="none">
          {centerLabel ? (
            <Text variant="caption" color="textSecondary" align="center">
              {centerLabel}
            </Text>
          ) : null}
          {centerValue ? (
            <Text variant="title2" tabular align="center">
              {centerValue}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.id} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: d.color }]} />
            <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
              {d.label}
            </Text>
            <Text variant="caption" tabular>
              {formatCents(d.value, { compact: true })}
            </Text>
            <Text variant="caption" color="textMuted" tabular style={{ width: 44, textAlign: 'right' }}>
              {percentOf(d.value, total)} %
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  empty: { borderWidth: 24 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
});
