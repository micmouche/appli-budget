/** Toast global : confirmation éphémère avec action « Annuler », animé, accessible. */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

interface ToastState {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  id: number;
  show: (message: string, options?: { actionLabel?: string; onAction?: () => void; icon?: string }) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message, options) =>
    set((s) => ({
      message,
      id: s.id + 1,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      icon: options?.icon,
    })),
  hide: () => set({ message: null, actionLabel: undefined, onAction: undefined }),
}));

export function showToast(
  message: string,
  options?: { actionLabel?: string; onAction?: () => void; icon?: string },
): void {
  useToast.getState().show(message, options);
}

export function ToastHost(): React.JSX.Element | null {
  const { message, actionLabel, onAction, icon, id, hide } = useToast();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, actionLabel ? 5000 : 2800);
    return () => clearTimeout(timer);
  }, [message, id, actionLabel, hide]);
  if (!message) return null;
  return (
    <Animated.View
      key={id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + 92 }]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.toast, { backgroundColor: theme.colors.text, borderRadius: theme.radius.md }]}>
        <Icon name={icon ?? 'CircleCheck'} color={theme.colors.bg} size={18} />
        <Text variant="callout" color={theme.colors.bg} style={{ flex: 1 }} numberOfLines={2}>
          {message}
        </Text>
        {actionLabel ? (
          <PressableScale
            onPress={() => {
              onAction?.();
              hide();
            }}
            haptic="light"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text variant="callout" color={theme.scheme === 'dark' ? theme.colors.brand : '#9FDCC2'}>
              {actionLabel}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
});
