/** Grande carte verte « Reste à dépenser » : montant héros, anneau, dépensé / budget, jours restants. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Cents } from '@/finance/money';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCents, formatPct } from '@/utils/format';

import { Icon } from './Icon';
import { PressableScale } from './Pressable';
import { Text } from './Text';
import { RingProgress } from './charts/RingProgress';

export interface BalanceCardProps {
  label: string;
  remainingCents: Cents;
  budgetCents: Cents;
  spentCents: Cents;
  daysLeft: number;
  /** Variation des dépenses vs mois précédent, en %. */
  variationPct?: number | null;
  onPress?: () => void;
}

export function BalanceCard({ label, remainingCents, budgetCents, spentCents, daysLeft, variationPct, onPress }: BalanceCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const ratio = budgetCents > 0 ? Math.min(1, spentCents / budgetCents) : 0;
  const white = theme.colors.onBrand;
  const soft = 'rgba(255,255,255,0.78)';
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`${label} ${formatCents(remainingCents)}`}
      style={{ backgroundColor: theme.colors.brand, borderRadius: theme.radius.lg, padding: theme.spacing[5], overflow: 'hidden' }}
    >
      <View style={{ position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="callout" style={{ color: soft }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Icon name="CalendarDays" color={white} size={13} strokeWidth={2} />
          <Text variant="caption" style={{ color: white }}>
            {t('budget.daysLeft', { count: daysLeft })}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing[3], gap: theme.spacing[4] }}>
        <View style={{ flex: 1 }}>
          <Text variant="hero" tabular style={{ color: white }} numberOfLines={1} adjustsFontSizeToFit>
            {formatCents(remainingCents)}
          </Text>
          <Text variant="caption" style={{ color: soft, marginTop: 4 }}>
            {t('home.outOf', { total: formatCents(budgetCents) })}
          </Text>
        </View>
        <RingProgress value={1 - ratio} size={88} stroke={9} color={white} trackColor="rgba(255,255,255,0.22)" accessibilityLabel={t('budget.remainingToSpend')}>
          <Text variant="headline" tabular style={{ color: white }}>
            {formatPct(Math.round((1 - ratio) * 100), 0)}
          </Text>
        </RingProgress>
      </View>
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: theme.spacing[3] }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" style={{ color: soft }}>
            {t('home.expenses')}
          </Text>
          <Text variant="headline" tabular style={{ color: white }}>
            {formatCents(spentCents)}
          </Text>
        </View>
        {variationPct !== null && variationPct !== undefined ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" style={{ color: soft }}>
              {t('home.vsLastMonth')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Icon name={variationPct > 0 ? 'TrendingUp' : 'TrendingDown'} color={white} size={14} strokeWidth={2} />
              <Text variant="headline" tabular style={{ color: white }}>
                {variationPct > 0 ? '+' : ''}
                {formatPct(variationPct)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}
