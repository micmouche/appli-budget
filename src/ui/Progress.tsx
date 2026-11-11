/** Barre et anneau de progression, couleur d'état automatique. */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

export interface ProgressBarProps {
  /** 0–1 (au-delà de 1 : plein, couleur « dépassé »). */
  value: number;
  level?: 'ok' | 'warning' | 'exceeded';
  color?: string;
  height?: number;
}

export function ProgressBar({ value, level = 'ok', color, height = 8 }: ProgressBarProps): React.JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const width = useSharedValue(0);
  const target = Math.min(1, Math.max(0, value));
  useEffect(() => {
    width.value = reduced
      ? target
      : withTiming(target, { duration: motion.slow, easing: Easing.out(Easing.cubic) });
  }, [target, reduced, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  const tint =
    level === 'exceeded'
      ? theme.colors.negative
      : level === 'warning'
        ? theme.colors.warningFill
        : (color ?? theme.colors.brand);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: theme.colors.surface2, overflow: 'hidden' }}
    >
      <Animated.View style={[fill, { height, borderRadius: height / 2, backgroundColor: tint }]} />
    </View>
  );
}
