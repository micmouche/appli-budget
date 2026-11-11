/**
 * Paywall : argumentaire + grille des offres. Le flux d'achat réel passe par le
 * paywall natif RevenueCat (presentPaywall) ; cet écran sert d'entrée et de repli
 * explicatif quand les achats sont indisponibles (Expo Go, simulateur).
 */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { presentPaywall, restorePurchases, usePremium } from '@/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { haptics } from '@/utils/haptics';

/** Prix affichés à titre indicatif ; les prix réels viennent du store via RevenueCat. */
const PLANS = [
  {
    id: 'yearly',
    labelKey: 'paywall.yearly',
    priceKey: 'paywall.perYear',
    price: '29,99 €',
    popular: true,
    trial: true,
  },
  {
    id: 'monthly',
    labelKey: 'paywall.monthly',
    priceKey: 'paywall.perMonth',
    price: '4,99 €',
    popular: false,
    trial: false,
  },
  {
    id: 'lifetime',
    labelKey: 'paywall.lifetime',
    priceKey: 'paywall.once',
    price: '79,99 €',
    popular: false,
    trial: false,
  },
] as const;

export default function PaywallScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  useLocalSearchParams<{ module?: string }>();
  const { available, isPremium } = usePremium();
  const [selected, setSelected] = useState<(typeof PLANS)[number]['id']>('yearly');
  const [busy, setBusy] = useState(false);

  const buy = async (): Promise<void> => {
    if (!available) {
      showToast(t('paywall.unavailable'), { icon: 'Info' });
      return;
    }
    setBusy(true);
    try {
      const ok = await presentPaywall();
      if (ok) {
        haptics.success();
        showToast(t('paywall.thanks'), { icon: 'Crown' });
        router.back();
      }
    } finally {
      setBusy(false);
    }
  };

  const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'];

  return (
    <Screen withHeader>
      <View style={{ alignItems: 'flex-end', marginTop: theme.spacing[2] }}>
        <IconButton name="X" accessibilityLabel={t('common.close')} onPress={() => router.back()} filled />
      </View>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing[4] }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: theme.colors.premiumBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="Crown" color="premium" size={32} />
        </View>
        <Text variant="title1" align="center" style={{ marginTop: theme.spacing[3] }}>
          {t('paywall.title')}
        </Text>
        <Text variant="body" color="textSecondary" align="center" style={{ marginTop: 6 }}>
          {t('paywall.subtitle')}
        </Text>
      </View>
      <View style={{ gap: theme.spacing[2], marginBottom: theme.spacing[5] }}>
        {features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Icon name="CircleCheck" color="brand" size={20} />
            <Text variant="callout" style={{ flex: 1 }}>
              {t(`paywall.${f}`)}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: theme.spacing[3] }}>
        {PLANS.map((p) => {
          const on = selected === p.id;
          return (
            <Card
              key={p.id}
              onPress={() => setSelected(p.id)}
              style={{
                borderColor: on ? theme.colors.brand : theme.colors.border,
                borderWidth: on ? 1.5 : 1,
              }}
              accessibilityLabel={t(p.labelKey)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <Icon
                  name={on ? 'CircleCheck' : 'Circle'}
                  color={on ? theme.colors.brand : theme.colors.textMuted}
                  size={22}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="headline">{t(p.labelKey)}</Text>
                    {p.popular ? (
                      <View
                        style={{
                          backgroundColor: theme.colors.brandSoft,
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text variant="micro" color="brand">
                          {t('paywall.mostPopular')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="caption" color="textSecondary">
                    {p.trial ? t('paywall.trial') : ' '}
                  </Text>
                </View>
                <Text variant="headline" tabular>
                  {t(p.priceKey, { price: p.price })}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>
      <Button
        label={isPremium ? t('settings.premiumActive') : t('paywall.cta')}
        onPress={() => void buy()}
        loading={busy}
        disabled={isPremium}
        style={{ marginTop: theme.spacing[5] }}
      />
      <Button
        label={t('paywall.restore')}
        variant="ghost"
        onPress={() =>
          void restorePurchases().then((ok) =>
            showToast(ok ? t('settings.restored') : t('settings.nothingToRestore')),
          )
        }
        style={{ marginTop: theme.spacing[2] }}
      />
      <Text variant="caption" color="textMuted" align="center" style={{ marginTop: theme.spacing[3] }}>
        {available ? t('paywall.legal') : t('paywall.unavailable')}
      </Text>
    </Screen>
  );
}
