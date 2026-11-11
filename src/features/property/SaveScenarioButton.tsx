/** Bouton « Sauvegarder en scénario » : Premium requis, sinon paywall. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePremium } from '@/purchases';
import { Button } from '@/ui/Button';

export function SaveScenarioButton({ params }: { params: Record<string, string> }): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  return (
    <Button
      label={t('property.saveScenario')}
      variant="secondary"
      icon={isPremium ? 'Save' : 'Crown'}
      onPress={() =>
        isPremium
          ? router.push({
              pathname: '/(tabs)/immo/simulateur/scenario/[id]',
              params: { id: 'new', ...params },
            })
          : router.push({ pathname: '/paywall', params: { module: 'property' } })
      }
    />
  );
}
