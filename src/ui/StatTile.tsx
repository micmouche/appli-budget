/** Tuile de statistique : libellé, grande valeur, variation, contenu optionnel. */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { Icon } from './Icon';
import { Text } from './Text';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: string;
  accent?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  badge?: string;
  style?: React.ComponentProps<typeof Card>['style'];
}

export function StatTile({
  label,
  value,
  caption,
  icon,
  accent,
  onPress,
  children,
  badge,
  style,
}: StatTileProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={[{ flex: 1, minHeight: 120 }, style]} accessibilityLabel={label}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[2],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          {icon ? <Icon name={icon} size={16} color={accent ?? theme.colors.textSecondary} /> : null}
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {label}
          </Text>
        </View>
        {badge ? (
          <View
            style={{
              backgroundColor: theme.colors.premiumBg,
              borderRadius: theme.radius.full,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text variant="micro" color="premium">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      {typeof value === 'string' ? <Text variant="title2">{value}</Text> : value}
      {caption ? (
        <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {caption}
        </Text>
      ) : null}
      {children}
    </Card>
  );
}
