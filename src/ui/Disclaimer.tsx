/** Encadré obligatoire sous chaque simulateur. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Icon } from './Icon';
import { Text } from './Text';

export function Disclaimer(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.wrap,
        { borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing[3] },
      ]}
    >
      <Icon name="Info" size={16} color="textMuted" />
      <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
        {t('common.disclaimer')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1 },
});
