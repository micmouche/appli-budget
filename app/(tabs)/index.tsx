/** Accueil (référence) : en-tête, anneau géant « Reste à dépenser », actions, dépenses mois par mois, opérations. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { setDemoMode } from '@/core/bootstrap';
import { categoryLabel, listRecurring } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { ScopeSelector } from '@/features/budget/ScopeSelector';
import {
  useAccounts,
  useBudgetMonth,
  useCurrentMonthKey,
  useMonthlyTotals,
  useScope,
  personName,
} from '@/features/budget/hooks';
import { expenseInScope, incomeInScope } from '@/features/budget/scope';
import { useHomeAlerts } from '@/features/home/alerts';
import { useSavings } from '@/features/savings/hooks';
import { useScenarios } from '@/features/property/hooks';
import { useRentals } from '@/features/rental/hooks';
import { useWorks } from '@/features/works/hooks';
import { usePremium } from '@/purchases';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeCardId } from '@/store/settings';
import { ActionIcon } from '@/ui/ActionIcon';
import { Amount } from '@/ui/Amount';
import { Banner } from '@/ui/Banner';
import { HeroRing } from '@/ui/HeroRing';
import { Icon } from '@/ui/Icon';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { AvatarGroup } from '@/ui/avatar/Avatar';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { Text } from '@/ui/Text';
import { BarChart } from '@/ui/charts/BarChart';
import { formatCents, formatDate, formatMonthKey, formatMonthShort, formatPct } from '@/utils/format';

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const monthKey = useCurrentMonthKey();
  const scope = useScope();
  const month = useBudgetMonth(monthKey);
  const totals = useMonthlyTotals(monthKey, 6);
  const { accounts } = useAccounts();
  const recurring = useQuery(() => listRecurring(), []);
  const alerts = useHomeAlerts();
  const homeCards = useSettings((s) => s.homeCards);
  const demoMode = useSettings((s) => s.demoMode);
  const couple = useSettings((s) => s.couple);
  const [daysLeft] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  });
  const { isPremium } = usePremium();
  const savings = useSavings();
  const scenarios = useScenarios();
  const rentals = useRentals();
  const works = useWorks();
  const activeWork = works[0];
  const lastScenario = scenarios[0];

  const first = month.persons[0];
  const partner = month.persons[1];
  const title = first ? t('profile.greeting', { name: first.name }) : t('home.greetingMorning');
  const label = `${formatMonthKey(monthKey)} · ${partner ? t('profile.sharedWith', { name: partner.name }) : t('profile.soloHousehold')}`;

  const fixedCents = useMemo(
    () =>
      recurring
        .filter((r) => r.active && expenseInScope(r, scope))
        .reduce(
          (a, r) =>
            a +
            (r.frequency === 'weekly'
              ? Math.round((r.amountCents * 52) / 12)
              : r.frequency === 'yearly'
                ? Math.round(r.amountCents / 12)
                : r.amountCents),
          0,
        ),
    [recurring, scope],
  );
  const goalsAvgPct = savings.goals.length
    ? Math.round(
        savings.goals.reduce((a, g) => a + Math.min(100, g.projection.progressPct), 0) / savings.goals.length,
      )
    : null;
  const recent = useMemo(
    () =>
      month.transactions
        .filter((tx) =>
          tx.kind === 'expense'
            ? expenseInScope(tx, scope)
            : tx.kind === 'income'
              ? incomeInScope(
                  tx,
                  scope,
                  accounts.map((a) => a.account),
                )
              : scope === 'all',
        )
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [month.transactions, scope, accounts],
  );
  const ratio = month.incomeCents > 0 ? Math.max(0, 1 - month.totalCents / month.incomeCents) : 0;
  const scopeLabel =
    scope === 'shared'
      ? t('budget.scope.sharedOnly')
      : scope === 'all'
        ? t('budget.remainingToSpend')
        : t('budget.scope.personalOf', { name: personName(month.persons, scope.slice(2), '') });
  const optionalCards = homeCards.filter((m) => m !== 'topCategory' && m !== 'savings');

  return (
    <Screen bottomInset={56}>
      <PageHeader
        label={label}
        title={title}
        onMenu={() => router.push('/(tabs)/reglages')}
        onBell={() => router.push('/alertes')}
        bellCount={alerts.length}
        onSettings={() => router.push('/(tabs)/reglages')}
        right={
          <PressableScale
            onPress={() => router.push('/(tabs)/reglages')}
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={t('profile.profiles')}
            style={{ marginRight: 6 }}
          >
            <AvatarGroup persons={month.persons} size={32} />
          </PressableScale>
        }
      />

      {demoMode ? (
        <View style={{ marginBottom: theme.spacing[4] }}>
          <Banner
            tone="info"
            icon="FlaskConical"
            title={t('home.demoBanner')}
            actionLabel={t('home.demoBannerAction')}
            onAction={() => setDemoMode(false)}
          />
        </View>
      ) : null}

      {couple ? (
        <View style={{ marginBottom: theme.spacing[5], alignItems: 'center' }}>
          <ScopeSelector persons={month.persons} />
        </View>
      ) : null}

      <Text variant="callout" color="textSecondary" align="center" style={{ marginBottom: theme.spacing[3] }}>
        {scopeLabel} · {t('budget.daysLeft', { count: daysLeft })}
      </Text>
      <HeroRing
        cents={month.balanceCents}
        ratio={ratio}
        caption={t('home.availableOutOf', { total: formatCents(month.incomeCents) })}
        onPress={() => router.push('/(tabs)/budget')}
        accessibilityLabel={`${scopeLabel} ${formatCents(month.balanceCents)}`}
      />

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
          label={t('home.addExpense').replace(' ', '\n')}
          onPress={() => router.push('/saisie-rapide')}
        />
        <ActionIcon
          icon="Pencil"
          label={t('home.editBudget').replace(' ', '\n')}
          onPress={() => router.push('/(tabs)/budget/categories')}
        />
      </View>

      {/* Indicateurs : épargne, charges fixes, objectifs */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing[8] }}>
        <PressableScale
          onPress={() => router.push('/(tabs)/epargne')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('home.savingsLabel')}
          style={{ flex: 1 }}
        >
          <Text variant="callout" color="textSecondary">
            {t('home.savingsLabel')}
          </Text>
          <Amount cents={savings.totalCents} variant="title2" compact color="brand" />
        </PressableScale>
        <PressableScale
          onPress={() => router.push('/(tabs)/budget/recurrences')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('home.fixedLabel')}
          style={{ flex: 1, alignItems: 'center' }}
        >
          <Text variant="callout" color="textSecondary">
            {t('home.fixedLabel')}
          </Text>
          <Amount cents={fixedCents} variant="title2" compact />
        </PressableScale>
        <PressableScale
          onPress={() => router.push('/(tabs)/epargne')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('home.goalsLabel')}
          style={{ flex: 1, alignItems: 'flex-end' }}
        >
          <Text variant="callout" color="textSecondary">
            {t('home.goalsLabel')}
          </Text>
          <Text variant="title2" tabular color={goalsAvgPct === null ? 'textMuted' : 'text'}>
            {goalsAvgPct === null ? '—' : formatPct(goalsAvgPct, 0)}
          </Text>
        </PressableScale>
      </View>

      {/* Mois par mois */}
      <SectionHeader
        label={t('home.monthToMonth')}
        title={t('home.spending')}
        onPress={() => router.push('/(tabs)/budget/historique')}
      />
      <BarChart
        data={totals.map((m) => ({
          key: m.monthKey,
          label: formatMonthShort(m.monthKey).toUpperCase(),
          value: m.totalCents,
        }))}
        height={190}
        color={theme.colors.chartAccent}
        gradient
      />
      <View style={{ height: 2, backgroundColor: theme.colors.chartAccent, opacity: 0.8, marginTop: -2 }} />
      <Text
        variant="headline"
        color="brand"
        align="right"
        style={{ marginTop: theme.spacing[3] }}
        onPress={() => router.push('/(tabs)/budget/historique')}
        accessibilityRole="link"
      >
        {t('home.spendingAnalysis')}
      </Text>

      {/* Opérations du mois */}
      <SectionHeader
        label={t('home.transactionsFor')}
        title={formatMonthKey(monthKey).replace(/^./, (c) => c.toUpperCase())}
        right={
          <PressableScale
            onPress={() => router.push('/(tabs)/budget/operations')}
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={t('home.seeAll')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 40,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text variant="callout">{t('home.seeAll')}</Text>
            <Icon name="ChevronDown" color="text" size={18} strokeWidth={2.25} />
          </PressableScale>
        }
      />
      {recent.length === 0 ? (
        <Text variant="body" color="textSecondary">
          {t('home.noRecent')}
        </Text>
      ) : (
        recent.map((op) => {
          const cat = month.categories.find((c) => c.id === op.categoryId);
          const name =
            op.kind === 'income'
              ? t(`budget.income.sources.${op.incomeSource ?? 'other'}`)
              : op.kind === 'transfer'
                ? t('budget.kinds.transfer')
                : cat
                  ? categoryLabel(cat)
                  : '?';
          return (
            <PressableScale
              key={op.id}
              onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: op.id } })}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={`${name} ${formatCents(op.amountCents)}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing[3],
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="title2" style={{ fontFamily: undefined }} numberOfLines={1}>
                  {op.note || name}
                </Text>
                <Text variant="callout" color="textSecondary">
                  {formatDate(op.date)}
                  {op.note ? ` · ${name}` : ''}
                </Text>
              </View>
              <Amount
                cents={op.kind === 'income' ? op.amountCents : -op.amountCents}
                variant="title2"
                colored={op.kind === 'income'}
                signed={op.kind === 'income'}
              />
            </PressableScale>
          );
        })
      )}

      {/* Cartes optionnelles : loyers, travaux, immobilier */}
      {optionalCards.length > 0 ? (
        <View style={{ marginTop: theme.spacing[6] }}>
          {optionalCards.map((m) => {
            const meta: Record<
              Exclude<HomeCardId, 'topCategory'>,
              { label: string; icon: string; value: string; caption: string; href: string }
            > = {
              savings: {
                label: t('home.totalSavings'),
                icon: 'PiggyBank',
                value:
                  isPremium || savings.accounts.length > 0
                    ? formatCents(savings.totalCents, { compact: true })
                    : '24 350 €',
                caption:
                  isPremium || savings.accounts.length > 0
                    ? savings.goals.length
                      ? t('home.goalsCaption', {
                          done: savings.goals.filter((g) => g.projection.reached).length,
                          total: savings.goals.length,
                        })
                      : t('home.savingsCaption', { count: savings.accounts.length })
                    : t('home.premiumTeaser'),
                href: '/(tabs)/epargne',
              },
              property: {
                label: t('home.lastScenario'),
                icon: 'KeyRound',
                value: lastScenario
                  ? formatCents(lastScenario.result.totalMonthlyCents) + ' / mois'
                  : isPremium
                    ? '—'
                    : '1 159 € / mois',
                caption: lastScenario
                  ? t('home.scenarioCaption', {
                      name: lastScenario.scenario.name,
                      ratio: formatPct(lastScenario.result.debtRatioPct),
                    })
                  : isPremium
                    ? t('property.scenariosHint')
                    : t('home.premiumTeaser'),
                href: lastScenario ? '/(tabs)/immo/simulateur/scenarios' : '/(tabs)/immo/simulateur',
              },
              rental: {
                label: t('home.rents'),
                icon: 'Building',
                value:
                  rentals.views.length > 0
                    ? formatCents(rentals.monthPaidCents, { compact: true })
                    : isPremium
                      ? '—'
                      : '2 / 2 encaissés',
                caption:
                  rentals.views.length > 0
                    ? t('home.rentsCaption', {
                        paid: rentals.monthViews.filter((p) => p.status === 'paid').length,
                        total: rentals.monthViews.length,
                        amount: formatCents(rentals.monthDueCents, { compact: true }),
                      })
                    : isPremium
                      ? t('rental.noProperties')
                      : t('home.premiumTeaser'),
                href: '/(tabs)/immo/locatif',
              },
              works: {
                label: t('home.works'),
                icon: 'Hammer',
                value: activeWork
                  ? `${Math.round(activeWork.totals.paidPct)} %`
                  : isPremium
                    ? '—'
                    : '62 % payé',
                caption: activeWork
                  ? `${activeWork.project.name} · ${t('home.worksCaption', { paid: formatCents(activeWork.totals.paidCents, { compact: true }), committed: formatCents(activeWork.totals.committedCents, { compact: true }) })}`
                  : isPremium
                    ? t('works.noProjects')
                    : t('home.premiumTeaser'),
                href: activeWork ? '/(tabs)/immo/travaux' : '/(tabs)/immo/travaux',
              },
            };
            const info = meta[m as Exclude<HomeCardId, 'topCategory'>];
            return (
              <PressableScale
                key={m}
                onPress={() => router.push(info.href as never)}
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={info.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[4],
                  paddingVertical: theme.spacing[3],
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.colors.brandSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={info.icon} color="brand" size={20} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="callout" color="textSecondary">
                    {info.label}
                    {isPremium ? '' : ` · ${t('common.premium')}`}
                  </Text>
                  <Text variant="headline" numberOfLines={1}>
                    {info.value} · {info.caption}
                  </Text>
                </View>
                <Icon name="ChevronRight" color="textMuted" size={20} />
              </PressableScale>
            );
          })}
        </View>
      ) : null}
      <Text
        variant="callout"
        color="brand"
        align="center"
        style={{ marginTop: theme.spacing[6] }}
        onPress={() => router.push('/(tabs)/reglages/accueil')}
        accessibilityRole="link"
      >
        {t('home.customize')}
      </Text>
    </Screen>
  );
}
