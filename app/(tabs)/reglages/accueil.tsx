/** Personnalisation de l'accueil : cartes affichées. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ALL_HOME_CARDS, useSettings, type HomeCardId } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

const ICONS: Record<HomeCardId, string> = { topCategory: 'Wallet', savings: 'PiggyBank', property: 'KeyRound', rental: 'Building', works: 'Hammer' };

export default function HomeCardsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const cards = useSettings((s) => s.homeCards);
  const set = useSettings((s) => s.set);
  const toggle = (id: HomeCardId, on: boolean): void => {
    set('homeCards', on ? [...cards.filter((c) => c !== id), id] : cards.filter((c) => c !== id));
  };
  return (
    <Screen>
      <SubScreenHeader title={t('home.customize')} />
      <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
        {t('home.cardsHint')}
      </Text>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        {ALL_HOME_CARDS.map((id, i) => (
          <ListRow key={id} icon={ICONS[id]} iconColor={id === 'topCategory' ? theme.module.budget : theme.module[id]} title={t(`home.cards.${id}`)} last={i === ALL_HOME_CARDS.length - 1} right={<Switch value={cards.includes(id)} onValueChange={(v) => toggle(id, v)} trackColor={{ true: theme.colors.brand }} accessibilityLabel={t(`home.cards.${id}`)} />} />
        ))}
      </Card>
    </Screen>
  );
}
