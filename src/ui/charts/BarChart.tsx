/**
 * Barres mensuelles (Skia). Barres fines, extrémités arrondies 4 pt, grille discrète,
 * libellés en jetons de texte. La barre du mois sélectionné est en couleur brand.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useFont } from '@shopify/react-native-skia';
import { Bar, CartesianChart } from 'victory-native';

import type { Cents } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCents } from '@/utils/format';

import { Text } from '../Text';

const interRegular = require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

export interface BarDatum {
  key: string;
  label: string;
  value: Cents;
}

export interface BarChartProps {
  data: BarDatum[];
  height?: number;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  accessibilitySummary?: string;
}

export function BarChart({
  data,
  height = 160,
  selectedKey,
  accessibilitySummary,
}: BarChartProps): React.JSX.Element {
  const theme = useTheme();
  const font = useFont(interRegular, 11);
  const rows = data.map((d, i) => ({ x: i, y: d.value / 100, label: d.label }));
  const max = Math.max(1, ...rows.map((r) => r.y));
  const summary =
    accessibilitySummary ??
    data.map((d) => `${d.label} ${formatCents(d.value, { compact: true })}`).join(', ');
  return (
    <View accessible accessibilityLabel={summary} style={{ height }}>
      <CartesianChart
        data={rows}
        xKey="x"
        yKeys={['y']}
        domain={{ y: [0, max * 1.15] }}
        domainPadding={{ left: 18, right: 18, top: 8 }}
        padding={{ left: 0, right: 0, top: 4, bottom: 4 }}
        xAxis={{
          font,
          labelColor: theme.colors.textSecondary,
          lineWidth: 0,
          tickCount: rows.length,
          formatXLabel: (v) => rows[Number(v)]?.label ?? '',
        }}
        yAxis={[
          {
            font,
            labelColor: theme.colors.textMuted,
            lineColor: theme.colors.border,
            lineWidth: 1,
            tickCount: 3,
            formatYLabel: (v) => formatAxis(Number(v)),
          },
        ]}
      >
        {({ points, chartBounds }) => (
          <>
            {points.y.map((p, i) => {
              const key = data[i]?.key;
              const color = key === selectedKey ? theme.colors.brand : `${theme.colors.brand}80`;
              return (
                <Bar
                  key={key ?? i}
                  points={[p]}
                  chartBounds={chartBounds}
                  barCount={rows.length}
                  innerPadding={0.45}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  color={color}
                  animate={{ type: 'timing', duration: 400 }}
                />
              );
            })}
          </>
        )}
      </CartesianChart>
      {data.length === 0 ? (
        <View style={StyleSheet.absoluteFill}>
          <Text variant="caption" color="textMuted" align="center">
            —
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function formatAxis(euros: number): string {
  if (euros >= 1000) return `${Math.round(euros / 100) / 10} k€`;
  return `${Math.round(euros)} €`;
}
