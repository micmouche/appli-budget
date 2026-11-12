/** Épargne (référence « Savings ») : synthèse, gros total vert, variation, courbe, comptes, objectifs avec badge « atteint ». */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PremiumGate } from '@/core/PremiumGate';
import { useSavings } from '@/features/savings/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { ActionIcon } from '@/ui/ActionIcon';
import { Amount } from '@/ui/Amount';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { Text } from '@/ui/Text';
import { LineChart } from '@/ui/charts/LineChart';
import { formatCents, formatDate, formatMonthShort, splitEuros } from '@/utils/format';

type GoalFilter = 'all' | 'reached' | 'inProgress';

export default function SavingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { accounts, goals, totalCents, series } = useSavings();
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('all');
  const { main, rest } = splitEuros(totalCents);
  const last = series[series.length - 1]?.totalCents ?? 0;
  const prev = series[series.length - 2]?.totalCents ?? 0;
  const variation = last - prev;
  const shownGoals = goals.filter((g) =>
    goalFilter === 'all' ? true : goalFilter === 'reached' ? g.projection.reached : !g.projection.reached,
  );
  const nextFilter: Record<GoalFilter, GoalFilter> = {
    all: 'reached',
    reached: 'inProgress',
    inProgress: 'all',
  };
  const gold = '#B8862B';

  return (
    <PremiumGate module="savings">
      <Screen bottomInset={56}>
        <PageHeader
          label={t('savings.allTime')}
          title={t('savings.title')}
          right={
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                name="Calculator"
                color="brand"
                accessibilityLabel={t('savings.simulator')}
                onPress={() => router.push('/(tabs)/epargne/simulateur')}
              />
              <IconButton
                name="Plus"
                color="brand"
                accessibilityLabel={t('savings.addAccount')}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })
                }
                style={{ marginRight: -10 }}
              />
            </View>
          }
        />

        <SectionHeader
          title={t('savings.synopsis')}
          onPress={() => router.push('/(tabs)/epargne/simulateur')}
        />
        <Text variant="callout" color="textSecondary">
          {t('savings.total')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
          <Text
            variant="hero"
            tabular
            color="brand"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ flexShrink: 1 }}
          >
            {main}
          </Text>
          <Text variant="title2" tabular color="brand" style={{ marginBottom: 10, marginLeft: 2 }}>
            {rest}
          </Text>
        </View>
        {series.some((s) => s.totalCents !== 0) ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Icon
                name={variation >= 0 ? 'TrendingUp' : 'TrendingDown'}
                color={variation >= 0 ? 'positive' : 'negative'}
                size={16}
                strokeWidth={2.2}
              />
              <Amount cents={variation} variant="callout" colored signed />
              <Text variant="callout" color="textSecondary">
                {t('savings.thisMonth')}
              </Text>
            </View>
            <View style={{ marginTop: theme.spacing[4] }}>
              <LineChart
                data={series.map((s) => ({ label: formatMonthShort(s.monthKey), value: s.totalCents }))}
                height={150}
                color={theme.colors.brand}
              />
            </View>
          </>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing[4],
            marginTop: theme.spacing[6],
          }}
        >
          <ActionIcon
            icon="Plus"
            label={t('savings.addMovement').replace(' ', '\n')}
            onPress={() =>
              accounts[0]
                ? router.push({
                    pathname: '/(tabs)/epargne/mouvement/[id]',
                    params: { id: 'new', accountId: accounts[0].account.id },
                  })
                : router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })
            }
          />
          <ActionIcon
            icon="Target"
            label={t('savings.addGoal').replace(' ', '\n')}
            onPress={() => router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: 'new' } })}
          />
        </View>

        {/* Comptes */}
        <SectionHeader
          label={t('savings.breakdown')}
          title={t('savings.accounts')}
          right={
            <Text
              variant="headline"
              color="brand"
              onPress={() =>
                router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })
              }
              accessibilityRole="link"
            >
              {t('savings.addAccount')} »
            </Text>
          }
        />
        {accounts.length === 0 ? (
          <EmptyState
            icon="PiggyBank"
            title={t('savings.noAccounts')}
            body={t('savings.noAccountsHint')}
            compact
            actionLabel={t('savings.addAccount')}
            onAction={() => router.push({ pathname: '/(tabs)/epargne/compte/editer', params: { id: 'new' } })}
          />
        ) : (
          accounts.map((s, i) => {
            const color = theme.chart[s.account.colorIndex % theme.chart.length] ?? theme.colors.brand;
            const share = totalCents > 0 ? s.balanceCents / totalCents : 0;
            return (
              <PressableScale
                key={s.account.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/epargne/compte/[id]', params: { id: s.account.id } })
                }
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={s.account.name}
                style={{
                  paddingVertical: theme.spacing[3],
                  borderBottomWidth: i === accounts.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                  <CategoryIcon icon={iconForType(s.account.type)} color={color} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="headline">{s.account.name}</Text>
                    <Text variant="callout" color="textSecondary">
                      {s.ceiling
                        ? s.ceiling.level === 'reached'
                          ? t('savings.ceilingReached')
                          : t('savings.ceilingUsed', { pct: Math.round(s.ceiling.usedPct) })
                        : t(`savings.types.${s.account.type}`)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Amount cents={s.balanceCents} variant="title2" />
                    <Text variant="caption" color="textMuted">
                      {Math.round(share * 100)} %
                    </Text>
                  </View>
                </View>
                <ProgressBar value={share} color={color} height={6} />
              </PressableScale>
            );
          })
        )}

        {/* Objectifs */}
        <SectionHeader
          label={t('savings.snapshotLabel')}
          title={t('savings.goals')}
          right={
            <PressableScale
              onPress={() => setGoalFilter(nextFilter[goalFilter])}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel={t('savings.filter')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 44,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View>
                <Text variant="caption" color="textSecondary">
                  {t('savings.filter')} :
                </Text>
                <Text variant="callout">{t(`savings.goalFilters.${goalFilter}`)}</Text>
              </View>
              <Icon name="ChevronDown" color="text" size={18} strokeWidth={2.25} />
            </PressableScale>
          }
        />
        {goals.length === 0 ? (
          <EmptyState
            icon="Target"
            title={t('savings.noGoals')}
            body={t('savings.noGoalsHint')}
            compact
            actionLabel={t('savings.addGoal')}
            onAction={() => router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: 'new' } })}
          />
        ) : shownGoals.length === 0 ? (
          <Text variant="body" color="textSecondary">
            {t('savings.noGoalsForFilter')}
          </Text>
        ) : (
          shownGoals.map((g, i) => {
            const color = theme.chart[g.goal.colorIndex % theme.chart.length] ?? theme.colors.brand;
            const p = g.projection;
            return (
              <PressableScale
                key={g.goal.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: g.goal.id } })
                }
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={g.goal.name}
                style={{
                  paddingVertical: theme.spacing[4],
                  borderBottomWidth: i === shownGoals.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: p.reached ? gold : `${color}22`,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Icon
                      name={p.reached ? 'BellRing' : g.goal.icon}
                      color={p.reached ? '#FFFFFF' : color}
                      size={14}
                      strokeWidth={2.4}
                    />
                    <Text variant="callout" style={{ color: p.reached ? '#FFFFFF' : color }}>
                      {p.reached ? t('savings.goalReached') : `${Math.min(100, Math.round(p.progressPct))} %`}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="title2" style={{ flex: 1 }} numberOfLines={1}>
                    {g.goal.name}
                  </Text>
                  <Amount
                    cents={p.reached ? p.targetCents : p.currentCents}
                    variant="title2"
                    color={p.reached ? 'text' : 'brand'}
                  />
                </View>
                {!p.reached ? (
                  <>
                    <ProgressBar value={p.progressPct / 100} color={color} height={6} />
                    <Text variant="caption" color="textSecondary">
                      {t('savings.goalProgress', {
                        current: formatCents(p.currentCents, { compact: true }),
                        target: formatCents(p.targetCents, { compact: true }),
                      })}
                      {g.goal.targetDate ? ` · ${formatDate(g.goal.targetDate)}` : ''}
                      {p.suggestedMonthlyCents !== null
                        ? ` · ${t('savings.suggestedMonthly')} ${formatCents(p.suggestedMonthlyCents)}`
                        : ''}
                    </Text>
                  </>
                ) : null}
              </PressableScale>
            );
          })
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
