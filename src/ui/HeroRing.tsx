/** Grand anneau central (référence) : montant énorme, décimales en petit, sous-titre fin. */
import React from 'react';
import { View } from 'react-native';

import type { Cents } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { splitEuros } from '@/utils/format';

import { PressableScale } from './Pressable';
import { Text } from './Text';
import { RingProgress } from './charts/RingProgress';

export interface HeroRingProps {
  cents: Cents;
  /** 0–1, part de l'anneau colorée. */
  ratio: number;
  caption: string;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function HeroRing({ cents, ratio, caption, size = 270, onPress, accessibilityLabel }: HeroRingProps): React.JSX.Element {
  const theme = useTheme();
  const { main, rest } = splitEuros(cents);
  const big = size >= 240 ? 'hero' : 'display';
  const inner = (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text variant={big} tabular color={cents < 0 ? 'negative' : 'text'} numberOfLines={1} adjustsFontSizeToFit>
          {main}
        </Text>
        <Text variant="title2" tabular color={cents < 0 ? 'negative' : 'textSecondary'} style={{ marginBottom: 8, marginLeft: 2 }}>
          {rest}
        </Text>
      </View>
      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: 2 }}>
        {caption}
      </Text>
    </View>
  );
  const ring = (
    <RingProgress value={ratio} size={size} stroke={14} color={theme.colors.text} trackColor={theme.colors.surface2} accessibilityLabel={accessibilityLabel}>
      {inner}
    </RingProgress>
  );
  return (
    <View style={{ alignItems: 'center' }}>
      {onPress ? (
        <PressableScale onPress={onPress} haptic="light" scaleTo={0.98} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {ring}
        </PressableScale>
      ) : (
        ring
      )}
    </View>
  );
}
