/**
 * Verrou Premium : rend l'écran normalement si l'abonnement est actif ; sinon,
 * affiche une vitrine (contenu d'exemple atténué + carte explicative + bouton).
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { usePremium } from '@/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import type { ModuleId } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

export interface PremiumGateProps {
  module: ModuleId;
  children: React.ReactNode;
  /** Contenu d'exemple affiché derrière la vitrine (sinon children atténués). */
  preview?: React.ReactNode;
}

export function PremiumGate({ module, children, preview }: PremiumGateProps): React.JSX.Element {
  const { isPremium } = usePremium();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  if (isPremium) return <>{children}</>;
  return (
    <View style={{ flex: 1 }}>
      <View
        pointerEvents="none"
        style={{ flex: 1, opacity: 0.35 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {preview ?? children}
      </View>
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-none">
        <Card tone="premium" style={{ borderColor: theme.colors.premium, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="Crown" color="premium" size={20} />
            <Text variant="headline">{t('paywall.moduleLocked')}</Text>
          </View>
          <Text variant="callout" color="textSecondary" style={{ marginBottom: 14 }}>
            {t('paywall.moduleLockedBody')}
          </Text>
          <Button
            label={t('common.unlock')}
            onPress={() => router.push({ pathname: '/paywall', params: { module } })}
            icon="Sparkles"
          />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ overlay: { justifyContent: 'flex-end', padding: 20, paddingBottom: 32 } });
