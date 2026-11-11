/**
 * Retours haptiques centralisés (voir design system § mouvement et haptique).
 * Chaque appel est sûr : ignoré si le module natif est absent (web, tests).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  light(): void {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  selection(): void {
    if (enabled) void Haptics.selectionAsync().catch(() => undefined);
  },
  success(): void {
    if (enabled)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
  warning(): void {
    if (enabled)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  },
  error(): void {
    if (enabled)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
  },
};
