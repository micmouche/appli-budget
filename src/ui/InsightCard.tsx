/** Carte de conseil contextualisé : icône teintée, titre, message, action optionnelle. */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { Icon } from './Icon';
import { Text } from './Text';

export interface InsightCardProps {
  tone?: 'brand' | 'accent' | 'lavender' | 'negative';
  icon: string;
  title: string;
  body?: string;
  onPress?: () => void;
}

export function InsightCard({ tone = 'brand', icon, title, body, onPress }: InsightCardProps): React.JSX.Element {
  const theme = useTheme();
  const color = tone === 'accent' ? theme.colors.accent : tone === 'lavender' ? theme.colors.lavender : tone === 'negative' ? theme.colors.negative : theme.colors.brand;
  const soft = tone === 'accent' ? theme.colors.accentSoft : tone === 'lavender' ? theme.colors.lavenderSoft : tone === 'negative' ? `${theme.colors.negative}1A` : theme.colors.brandSoft;
  return (
    <Card onPress={onPress} accessibilityLabel={title} style={{ backgroundColor: soft, borderColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing[3], alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} color={color} size={20} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline">{title}</Text>
          {body ? (
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {body}
            </Text>
          ) : null}
        </View>
        {onPress ? <Icon name="ChevronRight" color="textMuted" size={18} /> : null}
      </View>
    </Card>
  );
}
