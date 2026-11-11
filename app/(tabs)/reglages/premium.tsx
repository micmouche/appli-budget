/** Premium : statut, gestion, restauration (+ interrupteur dev). */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { presentCustomerCenter, restorePurchases, usePremium } from '@/purchases';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';

export default function PremiumScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { isPremium, available } = usePremium();
  const devPremium = useSettings((s) => s.devPremium);
  const set = useSettings((s) => s.set);
  const [restoring, setRestoring] = useState(false);

  const restore = async (): Promise<void> => {
    setRestoring(true);
    try {
      const ok = await restorePurchases();
      showToast(ok ? t('settings.restored') : t('settings.nothingToRestore'));
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <SubScreenHeader title={t('settings.premium')} />
      <Card tone="premium" style={{ marginBottom: theme.spacing[3], borderWidth: 0 }}>
        <Text variant="headline">
          {isPremium ? t('settings.premiumActive') : t('settings.premiumInactive')}
        </Text>
        {!isPremium ? (
          <Button
            label={t('common.unlock')}
            icon="Sparkles"
            onPress={() => router.push('/paywall')}
            style={{ marginTop: theme.spacing[3] }}
          />
        ) : null}
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
        {isPremium && available ? (
          <ListRow
            icon="CreditCard"
            title={t('settings.manageSubscription')}
            chevron
            onPress={() => void presentCustomerCenter()}
          />
        ) : null}
        <ListRow
          icon="RotateCcw"
          title={t('settings.restorePurchases')}
          chevron
          last
          onPress={restoring ? undefined : () => void restore()}
        />
      </Card>
      {__DEV__ ? (
        <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginTop: theme.spacing[3] }}>
          <ListRow
            icon="FlaskConical"
            title="Simuler Premium (dev)"
            last
            right={
              <Switch
                value={devPremium}
                onValueChange={(v) => set('devPremium', v)}
                trackColor={{ true: theme.colors.brand }}
              />
            }
          />
        </Card>
      ) : null}
    </Screen>
  );
}
