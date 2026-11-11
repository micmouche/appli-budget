/** Mini courbe sans axes (tuile d'accueil). */
import React from 'react';
import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface SparklineProps {
  values: number[];
  height?: number;
  color?: string;
}

export function Sparkline({ values, height = 36, color }: SparklineProps): React.JSX.Element | null {
  const theme = useTheme();
  if (values.length < 2) return null;
  const data = values.map((y, x) => ({ x, y }));
  return (
    <View style={{ height }} pointerEvents="none" accessible={false}>
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={['y']}
        padding={2}
        axisOptions={{ lineWidth: 0, labelColor: 'transparent' }}
      >
        {({ points }) => (
          <Line
            points={points.y}
            color={color ?? theme.colors.brand}
            strokeWidth={2}
            curveType="natural"
            animate={{ type: 'timing', duration: 400 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
