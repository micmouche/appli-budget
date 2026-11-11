/** Réglages : liste des sections. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Constants from 'expo-constants';

import { usePremium } from '@/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium } = usePremium();
  return (
    <Screen title={t('settings.title')}>
      <Card
        tone="premium"
        onPress={() => router.push('/(tabs)/reglages/premium')}
        style={{ marginBottom: theme.spacing[4], borderWidth: 0 }}
        accessibilityLabel={t('settings.premium')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <Icon name="Crown" color="premium" size={28} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">{t('settings.premium')}</Text>
            <Text variant="caption" color="textSecondary">
              {isPremium ? t('settings.premiumActive') : t('settings.premiumInactive')}
            </Text>
          </View>
          <Icon name="ChevronRight" color="textMuted" size={20} />
        </View>
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        <ListRow
          icon="Palette"
          title={t('settings.appearance')}
          chevron
          onPress={() => router.push('/(tabs)/reglages/apparence')}
        />
        <ListRow
          icon="Users"
          title={t('budget.household')}
          chevron
          onPress={() => router.push('/(tabs)/budget/foyer')}
        />
        <ListRow
          icon="Database"
          title={t('settings.data')}
          chevron
          onPress={() => router.push('/(tabs)/reglages/donnees')}
        />
        <ListRow
          icon="ShieldCheck"
          title={t('settings.security')}
          chevron
          onPress={() => router.push('/(tabs)/reglages/securite')}
        />
        <ListRow
          icon="Info"
          title={t('settings.about')}
          subtitle={t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          chevron
          last
          onPress={() => router.push('/(tabs)/reglages/a-propos')}
        />
      </Card>
    </Screen>
  );
}
