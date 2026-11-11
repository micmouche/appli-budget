/** Bandeau d'alerte en tête d'écran (info, warning, negative, premium), avec action. */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface BannerProps {
  tone: 'info' | 'warning' | 'negative' | 'positive' | 'premium';
  title: string;
  body?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
}

export function Banner({
  tone,
  title,
  body,
  icon,
  actionLabel,
  onAction,
  onPress,
}: BannerProps): React.JSX.Element {
  const theme = useTheme();
  const c = theme.colors;
  const accent =
    tone === 'premium'
      ? c.premium
      : tone === 'warning'
        ? c.warning
        : tone === 'negative'
          ? c.negative
          : tone === 'positive'
            ? c.positive
            : c.info;
  const bg = tone === 'premium' ? c.premiumBg : `${accent}1A`;
  const defaultIcon =
    tone === 'warning'
      ? 'TriangleExclamationPoint'
      : tone === 'negative'
        ? 'CircleExclamationPoint'
        : tone === 'positive'
          ? 'CircleCheck'
          : tone === 'premium'
            ? 'Crown'
            : 'Info';
  const content = (
    <View
      style={[styles.wrap, { backgroundColor: bg, borderRadius: theme.radius.md, padding: theme.spacing[3] }]}
    >
      <Icon name={icon ?? defaultIcon} color={accent} size={20} />
      <View style={{ flex: 1 }}>
        <Text variant="callout" color="text">
          {title}
        </Text>
        {body ? (
          <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <PressableScale onPress={onAction} haptic="light" accessibilityRole="button" hitSlop={8}>
          <Text variant="callout" color={accent}>
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} haptic="light" scaleTo={0.985} accessibilityRole="button">
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
