/** Épargne : total, courbe 12 mois, comptes (plafonds), objectifs, accès simulateur. */
import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PremiumGate } from '@/core/PremiumGate';
import { useSavings } from '@/features/savings/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { LineChart } from '@/ui/charts/LineChart';
import { formatCents, formatDate, formatMonthShort } from '@/utils/format';

export default function SavingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accounts, goals, totalCents, series } = useSavings();

  return (
    <PremiumGate module="savings">
      <Screen
        title={t('savings.title')}
        headerRight={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="Calculator"
              accessibilityLabel={t('savings.simulator')}
              onPress={() => router.push('/(tabs)/epargne/simulateur')}
            />
            <IconButton
              name="Plus"
              accessibilityLabel={t('savings.addAccount')}
              filled
              onPress={() =>
                router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })
              }
            />
          </View>
        }
      >
        <Card>
          <Text variant="caption" color="textSecondary">
            {t('savings.total')}
          </Text>
          <Amount cents={totalCents} variant="display" style={{ marginTop: 4 }} />
          {series.some((s) => s.totalCents !== 0) ? (
            <View style={{ marginTop: theme.spacing[3] }}>
              <LineChart
                data={series.map((s) => ({ label: formatMonthShort(s.monthKey), value: s.totalCents }))}
                height={140}
                color={theme.module.savings}
              />
            </View>
          ) : null}
        </Card>

        <Text variant="title2" style={{ marginTop: theme.spacing[5], marginBottom: theme.spacing[2] }}>
          {t('savings.accounts')}
        </Text>
        {accounts.length === 0 ? (
          <Card>
            <EmptyState
              icon="PiggyBank"
              title={t('savings.noAccounts')}
              body={t('savings.noAccountsHint')}
              compact
              actionLabel={t('savings.addAccount')}
              onAction={() =>
                router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })
              }
            />
          </Card>
        ) : (
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {accounts.map((s, i) => {
              const color = theme.chart[s.account.colorIndex % theme.chart.length] ?? theme.colors.brand;
              return (
                <ListRow
                  key={s.account.id}
                  icon={iconForType(s.account.type)}
                  iconColor={color}
                  title={s.account.name}
                  subtitle={
                    s.ceiling
                      ? s.ceiling.level === 'reached'
                        ? t('savings.ceilingReached')
                        : t('savings.ceilingUsed', { pct: Math.round(s.ceiling.usedPct) })
                      : t(`savings.types.${s.account.type}`)
                  }
                  right={<Amount cents={s.balanceCents} variant="headline" />}
                  chevron
                  last={i === accounts.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/epargne/compte/[id]', params: { id: s.account.id } })
                  }
                />
              );
            })}
          </Card>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing[5],
            marginBottom: theme.spacing[2],
          }}
        >
          <Text variant="title2">{t('savings.goals')}</Text>
          <Text
            variant="callout"
            color="brand"
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: 'new' } })}
          >
            {t('savings.addGoal')}
          </Text>
        </View>
        {goals.length === 0 ? (
          <Card>
            <EmptyState
              icon="Target"
              title={t('savings.noGoals')}
              body={t('savings.noGoalsHint')}
              compact
              actionLabel={t('savings.addGoal')}
              onAction={() =>
                router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: 'new' } })
              }
            />
          </Card>
        ) : (
          <View style={{ gap: theme.spacing[3] }}>
            {goals.map((g) => {
              const color = theme.chart[g.goal.colorIndex % theme.chart.length] ?? theme.colors.brand;
              const p = g.projection;
              return (
                <Card
                  key={g.goal.id}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: g.goal.id } })
                  }
                  accessibilityLabel={g.goal.name}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${color}1F`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={g.goal.icon} color={color} size={20} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="headline">{g.goal.name}</Text>
                      <Text variant="caption" color="textSecondary">
                        {p.reached
                          ? t('savings.goalReached')
                          : t('savings.goalProgress', {
                              current: formatCents(p.currentCents, { compact: true }),
                              target: formatCents(p.targetCents, { compact: true }),
                            })}
                      </Text>
                    </View>
                    <Text variant="headline" tabular color={p.reached ? 'positive' : 'text'}>
                      {Math.min(100, Math.round(p.progressPct))} %
                    </Text>
                  </View>
                  <View style={{ marginTop: theme.spacing[3] }}>
                    <ProgressBar
                      value={p.progressPct / 100}
                      color={p.reached ? theme.colors.positiveFill : color}
                    />
                  </View>
                  {!p.reached && g.goal.targetDate ? (
                    <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                      {formatDate(g.goal.targetDate)} ·{' '}
                      {p.suggestedMonthlyCents !== null
                        ? `${t('savings.suggestedMonthly')} ${formatCents(p.suggestedMonthlyCents)}`
                        : ''}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </Screen>
    </PremiumGate>
  );
}

export function iconForType(type: string): string {
  const map: Record<string, string> = {
    livretA: 'PiggyBank',
    ldds: 'Leaf',
    lep: 'HandCoins',
    pel: 'House',
    cel: 'House',
    livret: 'Landmark',
    assuranceVie: 'Shield',
    pea: 'TrendingUp',
    cto: 'ChartLine',
    crypto: 'Bitcoin',
    cash: 'Wallet',
    other: 'Coins',
  };
  return map[type] ?? 'Coins';
}
