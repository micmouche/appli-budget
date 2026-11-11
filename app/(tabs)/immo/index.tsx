/** Hub Immo : Simulateur · Locatif · Travaux (lots 3 à 5 : contenu réel). */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function PropertyHub(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const items = [
    {
      key: 'simulator',
      icon: 'Calculator',
      color: theme.module.property,
      title: t('property.simulator'),
      hint: t('property.simulatorHint'),
    },
    {
      key: 'rental',
      icon: 'Building',
      color: theme.module.rental,
      title: t('property.rental'),
      hint: t('property.rentalHint'),
    },
    {
      key: 'works',
      icon: 'Hammer',
      color: theme.module.works,
      title: t('property.works'),
      hint: t('property.worksHint'),
    },
  ];
  return (
    <Screen title={t('property.title')}>
      <View style={{ gap: theme.spacing[3] }}>
        {items.map((it) => (
          <Card
            key={it.key}
            onPress={() =>
              it.key === 'simulator'
                ? router.push('/(tabs)/immo/simulateur')
                : it.key === 'rental'
                  ? router.push('/(tabs)/immo/locatif')
                  : router.push('/(tabs)/immo/travaux')
            }
            accessibilityLabel={it.title}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${it.color}1F`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={it.icon} color={it.color} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">{it.title}</Text>
                <Text variant="caption" color="textSecondary">
                  {it.hint}
                </Text>
              </View>
              <Icon name="ChevronRight" color="textMuted" size={20} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
