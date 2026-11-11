/** En-tête d'écran secondaire : bouton retour + titre (pas de header natif pour garder la typo). */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { IconButton } from '@/ui/IconButton';
import { Text } from '@/ui/Text';

export function SubScreenHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        marginBottom: theme.spacing[4],
        marginLeft: -8,
      }}
    >
      <IconButton
        name="ChevronLeft"
        accessibilityLabel={t('common.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      />
      <Text variant="title2" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}
