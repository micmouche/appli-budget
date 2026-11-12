/** Titre de section (référence) : petit libellé gris, titre gras, action à droite (chevron ou contrôle). */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface SectionHeaderProps {
  label?: string;
  title: string;
  onPress?: () => void;
  right?: React.ReactNode;
  accessibilityLabel?: string;
}

export function SectionHeader({ label, title, onPress, right, accessibilityLabel }: SectionHeaderProps): React.JSX.Element {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing[8], marginBottom: theme.spacing[4] }}>
      <View>
        {label ? (
          <Text variant="callout" color="textSecondary">
            {label}
          </Text>
        ) : null}
        <Text variant="title2">{title}</Text>
      </View>
      {right ?? (onPress ? <Icon name="ChevronDown" color="text" size={22} strokeWidth={2.25} /> : null)}
    </View>
  );
  if (onPress) {
    return (
      <PressableScale onPress={onPress} haptic="light" accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title}>
        {content}
      </PressableScale>
    );
  }
  return content;
}
