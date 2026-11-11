/** Courbe avec aire légère (encours d'épargne, projection). Une seule série, pas de légende. */
import React from 'react';
import { View } from 'react-native';
import { useFont } from '@shopify/react-native-skia';
import { Area, CartesianChart, Line } from 'victory-native';

import type { Cents } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCents } from '@/utils/format';

const interRegular = require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

export interface LinePoint {
  label: string;
  value: Cents;
}

export interface LineChartProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  accessibilitySummary?: string;
  /** Nombre de libellés d'axe X affichés. */
  xLabels?: number;
}

export function LineChart({
  data,
  height = 160,
  color,
  accessibilitySummary,
  xLabels = 4,
}: LineChartProps): React.JSX.Element {
  const theme = useTheme();
  const font = useFont(interRegular, 11);
  const tint = color ?? theme.colors.brand;
  const rows = data.map((d, i) => ({ x: i, y: d.value / 100 }));
  const max = Math.max(1, ...rows.map((r) => r.y));
  const min = Math.min(0, ...rows.map((r) => r.y));
  const summary =
    accessibilitySummary ??
    (data.length
      ? `${data[0]!.label} ${formatCents(data[0]!.value, { compact: true })}, ${data[data.length - 1]!.label} ${formatCents(data[data.length - 1]!.value, { compact: true })}`
      : '');
  const step = Math.max(1, Math.round(rows.length / xLabels));
  return (
    <View accessible accessibilityLabel={summary} style={{ height }}>
      {rows.length >= 2 ? (
        <CartesianChart
          data={rows}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [min, max * 1.1] }}
          padding={{ left: 0, right: 8, top: 8, bottom: 4 }}
          xAxis={{
            font,
            labelColor: theme.colors.textSecondary,
            lineWidth: 0,
            tickValues: rows.filter((_, i) => i % step === 0 || i === rows.length - 1).map((r) => r.x),
            formatXLabel: (v) => data[Number(v)]?.label ?? '',
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
              <Area
                points={points.y}
                y0={chartBounds.bottom}
                color={`${tint}22`}
                curveType="monotoneX"
                animate={{ type: 'timing', duration: 400 }}
              />
              <Line
                points={points.y}
                color={tint}
                strokeWidth={2}
                curveType="monotoneX"
                animate={{ type: 'timing', duration: 400 }}
              />
            </>
          )}
        </CartesianChart>
      ) : null}
    </View>
  );
}

function formatAxis(euros: number): string {
  if (Math.abs(euros) >= 1000) return `${Math.round(euros / 100) / 10} k€`;
  return `${Math.round(euros)} €`;
}
