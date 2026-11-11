/** Pressable avec micro-animation d'échelle (Reanimated) et retour haptique optionnel. */
import React, { useCallback } from 'react';
import { Pressable as RNPressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'light' | 'selection' | 'none';
  children?: React.ReactNode;
}

export function PressableScale({
  scaleTo = 0.97,
  haptic = 'none',
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: PressableScaleProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      if (!reduced) scale.set(withTiming(scaleTo, { duration: motion.fast }));
      onPressIn?.(e);
    },
    [onPressIn, reduced, scale, scaleTo],
  );
  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      if (!reduced) scale.set(withTiming(1, { duration: motion.fast }));
      onPressOut?.(e);
    },
    [onPressOut, reduced, scale],
  );
  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (haptic === 'light') haptics.light();
      else if (haptic === 'selection') haptics.selection();
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={handlePress}
      style={[animated, style]}
    />
  );
}
