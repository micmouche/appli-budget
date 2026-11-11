/** État vide : icône, titre, texte, action. */
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  icon: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: compact ? theme.spacing[4] : theme.spacing[10],
        paddingHorizontal: theme.spacing[4],
        gap: theme.spacing[2],
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing[2],
        }}
      >
        <Icon name={icon} size={30} color="brand" />
      </View>
      <Text variant="headline" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="callout" color="textSecondary" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={{ marginTop: theme.spacing[3] }}
        />
      ) : null}
    </View>
  );
}
