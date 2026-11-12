/** Réglages : liste des sections. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Constants from 'expo-constants';

import { usePremium } from '@/purchases';
import { usePersons } from '@/features/budget/hooks';
import { Avatar } from '@/ui/avatar/Avatar';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { ListRow } from '@/ui/ListRow';
import { PageHeader } from '@/ui/PageHeader';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

export default function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { isPremium } = usePremium();
  const persons = usePersons();
  return (
    <Screen>
      <PageHeader back label={t('settings.label')} title={t('settings.title')} />
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
        {persons.map((p) => (
          <ListRow
            key={p.id}
            left={<Avatar person={p} size={40} ring />}
            title={p.name}
            subtitle={t('profile.edit')}
            chevron
            onPress={() => router.push({ pathname: '/(tabs)/reglages/profil/[id]', params: { id: p.id } })}
          />
        ))}
        <ListRow
          icon="LayoutGrid"
          title={t('home.customize')}
          chevron
          onPress={() => router.push('/(tabs)/reglages/accueil')}
        />
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
