/** Bandeau horizontal des comptes avec leur solde (écran Budget). */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { screenPadding } from '@/theme/tokens';
import { Amount } from '@/ui/Amount';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { Text } from '@/ui/Text';

import { useAccounts } from './hooks';

export const ACCOUNT_ICONS: Record<string, string> = { checking: 'Landmark', joint: 'Users', cash: 'Banknote', card: 'CreditCard', other: 'Wallet' };

export function AccountsStrip(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accounts } = useAccounts();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -screenPadding }} contentContainerStyle={{ paddingHorizontal: screenPadding, gap: 10 }}>
      {accounts.map((v) => {
        const color = theme.chart[v.account.colorIndex % theme.chart.length] ?? theme.colors.brand;
        return (
          <PressableScale key={v.account.id} onPress={() => router.push({ pathname: '/(tabs)/budget/compte/[id]', params: { id: v.account.id } })} haptic="light" accessibilityRole="button" accessibilityLabel={v.account.name} style={{ width: 150, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={ACCOUNT_ICONS[v.account.type] ?? 'Wallet'} color={color} size={15} />
              </View>
              <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
                {v.account.name}
              </Text>
            </View>
            <Amount cents={v.balanceCents} variant="headline" colored={v.balanceCents < 0} />
          </PressableScale>
        );
      })}
      <PressableScale onPress={() => router.push({ pathname: '/(tabs)/budget/compte/editer', params: { id: 'new' } })} haptic="light" accessibilityRole="button" accessibilityLabel={t('budget.accounts.addAccount')} style={{ width: 64, borderRadius: theme.radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="Plus" color="textSecondary" size={22} />
      </PressableScale>
    </ScrollView>
  );
}
