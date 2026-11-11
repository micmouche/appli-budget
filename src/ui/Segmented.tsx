/** Contrôle segmenté animé (2 à 4 options). */
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { haptics } from '@/utils/haptics';

import { Text } from './Text';

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>): React.JSX.Element {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const x = useSharedValue(0);
  const segment = options.length ? width / options.length : 0;

  useEffect(() => {
    x.value = withSpring(index * segment, { damping: 18, stiffness: 180 });
  }, [index, segment, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 4)}
      style={[styles.track, { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.sm }]}
      accessibilityRole="tablist"
    >
      {width > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            indicator,
            {
              width: segment,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.sm - 2,
              borderColor: theme.colors.border,
            },
          ]}
        />
      ) : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.selection();
              onChange(o.value);
            }}
            style={styles.item}
          >
            <Text variant="callout" color={selected ? 'text' : 'textSecondary'} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 2, height: 40, position: 'relative' },
  indicator: { position: 'absolute', top: 2, bottom: 2, left: 2, borderWidth: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
