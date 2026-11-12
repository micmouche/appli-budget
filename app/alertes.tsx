/** Notifications : alertes calculées (enveloppes, épargne, loyers, chantiers, règlement). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useHomeAlerts } from '@/features/home/alerts';
import { useTheme } from '@/theme/ThemeProvider';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function AlertsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const alerts = useHomeAlerts();
  return (
    <Screen>
      <PageHeader back label={t('home.alertsLabel')} title={t('home.alertsTitle')} />
      {alerts.length === 0 ? (
        <EmptyState icon="BellOff" title={t('home.noAlerts')} />
      ) : (
        alerts.map((a, i) => {
          const color = a.tone === 'negative' ? theme.colors.negative : a.tone === 'warning' ? theme.colors.accent : theme.colors.brand;
          return (
            <PressableScale key={a.key} onPress={a.onPress} haptic="light" accessibilityRole="button" accessibilityLabel={a.title} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4], paddingVertical: theme.spacing[4], borderBottomWidth: i === alerts.length - 1 ? 0 : 1, borderBottomColor: theme.colors.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.tone === 'negative' ? 'TriangleExclamationPoint' : a.tone === 'warning' ? 'TriangleExclamationPoint' : 'Info'} color={color} size={20} strokeWidth={2.2} />
              </View>
              <Text variant="headline" style={{ flex: 1 }}>
                {a.title}
              </Text>
              <Icon name="ChevronRight" color="textMuted" size={20} />
            </PressableScale>
          );
        })
      )}
    </Screen>
  );
}
