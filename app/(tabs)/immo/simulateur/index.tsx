/** Simulateur immobilier : choix du calcul. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function SimulatorHome(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const items = [
    { key: 'capacite', icon: 'Scale', title: t('property.capacity'), hint: t('property.capacityHint') },
    { key: 'mensualite', icon: 'Calculator', title: t('property.payment'), hint: t('property.paymentHint') },
    { key: 'notaire', icon: 'Landmark', title: t('property.notary'), hint: t('property.notaryHint') },
    {
      key: 'scenarios',
      icon: 'GitCompareArrows',
      title: t('property.scenarios'),
      hint: t('property.scenariosHint'),
      premium: true,
    },
  ] as const;
  return (
    <Screen>
      <SubScreenHeader title={t('property.simulator')} />
      <View style={{ gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
        {items.map((it) => (
          <Card
            key={it.key}
            onPress={() => router.push(`/(tabs)/immo/simulateur/${it.key}` as never)}
            accessibilityLabel={it.title}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${theme.module.property}1F`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={it.icon} color={theme.module.property} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="headline">{it.title}</Text>
                  {'premium' in it && it.premium ? <Icon name="Crown" color="premium" size={16} /> : null}
                </View>
                <Text variant="caption" color="textSecondary">
                  {it.hint}
                </Text>
              </View>
              <Icon name="ChevronRight" color="textMuted" size={20} />
            </View>
          </Card>
        ))}
      </View>
      <Disclaimer />
    </Screen>
  );
}
