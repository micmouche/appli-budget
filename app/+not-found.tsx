/** Route inconnue : retour à l'accueil. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { Screen } from '@/ui/Screen';

export default function NotFoundScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState icon="CircleQuestionMark" title={t('common.error')} />
      <Button label={t('tabs.home')} onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
