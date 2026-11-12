/** Accueil : tableau de bord (solde du mois, alertes, tuiles par module, rappel d'export). */
import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { differenceInDays } from 'date-fns';

import { setDemoMode } from '@/core/bootstrap';
import { shiftMonthKey } from '@/db/repositories';
import { useBudgetMonth, useCurrentMonthKey, useMonthlyTotals, personName } from '@/features/budget/hooks';
import { useSavings } from '@/features/savings/hooks';
import { useScenarios } from '@/features/property/hooks';
import { useRentals } from '@/features/rental/hooks';
import { useWorks } from '@/features/works/hooks';
import { usePremium } from '@/purchases';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeCardId } from '@/store/settings';
import { Amount } from '@/ui/Amount';
import { Banner } from '@/ui/Banner';
import { Card } from '@/ui/Card';
import { Fab } from '@/ui/Fab';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { AvatarGroup } from '@/ui/avatar/Avatar';
import { Screen } from '@/ui/Screen';
import { StatTile } from '@/ui/StatTile';
import { Text } from '@/ui/Text';
import { Sparkline } from '@/ui/charts/Sparkline';
import { formatCents, formatDate, formatMonthKey, formatPct } from '@/utils/format';
import { percentOf } from '@/finance/money';

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const monthKey = useCurrentMonthKey();
  const month = useBudgetMonth(monthKey);
  const previous = useBudgetMonth(shiftMonthKey(monthKey, -1));
  const totals = useMonthlyTotals(monthKey, 6);
  const homeCards = useSettings((s) => s.homeCards);
  const demoMode = useSettings((s) => s.demoMode);
  const lastExportAt = useSettings((s) => s.lastExportAt);
  const { isPremium } = usePremium();
  const savings = useSavings();
  const scenarios = useScenarios();
  const rentals = useRentals();
  const works = useWorks();
  const activeWork = works[0];
  const lastScenario = scenarios[0];

  const hour = new Date().getHours();
  const first = month.persons[0];
  const partner = month.persons[1];
  const greeting = first ? t('profile.greeting', { name: first.name }) : hour < 18 ? t('home.greetingMorning') : t('home.greetingEvening');
  const subtitle = `${formatMonthKey(monthKey)} · ${partner ? t('profile.sharedWith', { name: partner.name }) : t('profile.soloHousehold')}`;
  const variation =
    previous.totalCents > 0
      ? Math.round(((month.totalCents - previous.totalCents) / previous.totalCents) * 1000) / 10
      : null;

  const alerts = useMemo(() => {
    const list: { key: string; tone: 'warning' | 'negative' | 'info'; title: string; onPress: () => void }[] =
      [];
    for (const c of month.categoryTotals) {
      if (!c.envelope) continue;
      if (c.envelope.level === 'exceeded') {
        list.push({
          key: `env-${c.category.id}`,
          tone: 'negative',
          title: t('alerts.envelopeExceeded', {
            category: c.label,
            amount: formatCents(-c.envelope.remainingCents),
          }),
          onPress: () => router.push('/(tabs)/budget'),
        });
      } else if (c.envelope.level === 'warning') {
        list.push({
          key: `env-${c.category.id}`,
          tone: 'warning',
          title: t('alerts.envelopeWarning', { category: c.label, pct: Math.round(c.envelope.usedPct) }),
          onPress: () => router.push('/(tabs)/budget'),
        });
      }
    }
    for (const a of savings.accounts) {
      if (a.ceiling && a.ceiling.level !== 'ok') {
        list.push({
          key: `ceil-${a.account.id}`,
          tone: 'warning',
          title: t('savings.alertCeiling', { account: a.account.name }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/epargne/compte/[id]', params: { id: a.account.id } }),
        });
      }
    }
    for (const g of savings.goals) {
      if (g.projection.reached && !g.goal.achievedAt) {
        list.push({
          key: `goal-${g.goal.id}`,
          tone: 'info',
          title: t('savings.alertGoalReached', { goal: g.goal.name }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: g.goal.id } }),
        });
      }
    }
    for (const v of rentals.views) {
      for (const p of v.payments) {
        if (p.status === 'late') {
          list.push({
            key: `rent-${p.payment.id}`,
            tone: 'negative',
            title: t('rental.alertLate', {
              property: v.property.name,
              month: formatMonthKey(p.payment.periodKey),
            }),
            onPress: () =>
              router.push({ pathname: '/(tabs)/immo/locatif/loyer/[id]', params: { id: p.payment.id } }),
          });
        } else if (p.status === 'partial') {
          list.push({
            key: `rent-${p.payment.id}`,
            tone: 'warning',
            title: t('rental.alertPartial', {
              property: v.property.name,
              month: formatMonthKey(p.payment.periodKey),
            }),
            onPress: () =>
              router.push({ pathname: '/(tabs)/immo/locatif/loyer/[id]', params: { id: p.payment.id } }),
          });
        }
      }
    }
    for (const w of works) {
      if (w.totals.level === 'exceeded') {
        list.push({
          key: `work-${w.project.id}`,
          tone: 'negative',
          title: t('works.alertOverBudget', {
            project: w.project.name,
            amount: formatCents(w.totals.varianceCents, { compact: true }),
          }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/immo/travaux/chantier/[id]', params: { id: w.project.id } }),
        });
      }
      for (const p of w.payments) {
        if (p.status === 'late') {
          list.push({
            key: `wpay-${p.payment.id}`,
            tone: 'negative',
            title: t('works.alertPaymentLate', { project: w.project.name, label: p.payment.label }),
            onPress: () =>
              router.push({
                pathname: '/(tabs)/immo/travaux/paiement/[id]',
                params: { id: p.payment.id, projectId: w.project.id },
              }),
          });
        } else if (p.status === 'due') {
          list.push({
            key: `wpay-${p.payment.id}`,
            tone: 'warning',
            title: t('works.alertPaymentDue', {
              project: w.project.name,
              label: p.payment.label,
              date: formatDate(p.payment.dueDate),
            }),
            onPress: () =>
              router.push({
                pathname: '/(tabs)/immo/travaux/paiement/[id]',
                params: { id: p.payment.id, projectId: w.project.id },
              }),
          });
        }
      }
    }
    const tr = month.settlement.transfer;
    if (tr && !month.settlementRecord && month.persons.length > 1) {
      list.push({
        key: 'settlement',
        tone: 'info',
        title: t('alerts.settlementDue', {
          from: personName(month.persons, tr.fromId, '?'),
          to: personName(month.persons, tr.toId, '?'),
          amount: formatCents(tr.amountCents),
        }),
        onPress: () => router.push('/(tabs)/budget/reglement'),
      });
    }
    return list;
  }, [month, savings, rentals, works, router, t]);

  const exportDays = lastExportAt ? differenceInDays(new Date(), new Date(lastExportAt)) : null;
  const topCategory = month.categoryTotals[0];

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title={greeting}
        subtitle={subtitle}
        headerRight={
          <PressableScale onPress={() => router.push('/(tabs)/reglages')} haptic="light" accessibilityRole="button" accessibilityLabel={t('profile.profiles')}>
            <AvatarGroup persons={month.persons} size={34} />
          </PressableScale>
        }
        bottomInset={72}
      >
        {demoMode ? (
          <View style={{ marginBottom: theme.spacing[3] }}>
            <Banner
              tone="info"
              icon="FlaskConical"
              title={t('home.demoBanner')}
              actionLabel={t('home.demoBannerAction')}
              onAction={() => setDemoMode(false)}
            />
          </View>
        ) : null}

        {/* Carte héros */}
        <Card
          onPress={() => router.push('/(tabs)/budget')}
          style={{ marginBottom: theme.spacing[3] }}
          accessibilityLabel={t('home.monthBalance')}
        >
          <Text variant="caption" color="textSecondary">
            {t('home.monthBalance')}
          </Text>
          <Amount cents={month.balanceCents} variant="display" colored style={{ marginTop: 4 }} />
          <View style={{ flexDirection: 'row', gap: theme.spacing[5], marginTop: theme.spacing[3] }}>
            <View>
              <Text variant="caption" color="textMuted">
                {t('home.income')}
              </Text>
              <Amount cents={month.incomeCents} variant="callout" />
            </View>
            <View>
              <Text variant="caption" color="textMuted">
                {t('home.expenses')}
              </Text>
              <Amount cents={month.totalCents} variant="callout" />
            </View>
            {variation !== null ? (
              <View>
                <Text variant="caption" color="textMuted">
                  {t('home.vsLastMonth')}
                </Text>
                <Text variant="callout" tabular color={variation > 0 ? 'negative' : 'positive'}>
                  {variation > 0 ? '+' : ''}
                  {formatPct(variation)}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ marginTop: theme.spacing[3] }}>
            <Sparkline values={totals.map((m) => m.totalCents)} height={40} color={theme.colors.textMuted} />
          </View>
        </Card>

        {/* Alertes */}
        {alerts.length > 0 ? (
          <View style={{ gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
            {alerts.map((a) => (
              <Banner key={a.key} tone={a.tone} title={a.title} onPress={a.onPress} />
            ))}
          </View>
        ) : null}

        {/* Tuiles par module */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3] }}>
          {homeCards.map((m) => {
            if (m === 'topCategory') {
              return (
                <StatTile
                  key="topCategory"
                  label={t('budget.topCategory')}
                  icon="Wallet"
                  accent={theme.module.budget}
                  value={topCategory && topCategory.totalCents > 0 ? topCategory.label : '—'}
                  caption={
                    topCategory && topCategory.totalCents > 0
                      ? `${formatCents(topCategory.totalCents, { compact: true })} · ${formatPct(percentOf(topCategory.totalCents, month.totalCents), 0)}`
                      : t('budget.noExpenses')
                  }
                  onPress={() => router.push('/(tabs)/budget')}
                  style={{ minWidth: '47%' }}
                />
              );
            }
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
            const info = meta[m];
            return (
              <StatTile
                key={m}
                label={info.label}
                icon={info.icon}
                accent={theme.module[m]}
                value={info.value}
                caption={info.caption}
                badge={isPremium ? undefined : t('common.premium')}
                onPress={() => router.push(info.href as never)}
                style={{ minWidth: '47%' }}
              />
            );
          })}
          <Card onPress={() => router.push('/(tabs)/reglages/accueil')} tone="surface2" style={{ minWidth: '47%', flex: 1, minHeight: 120, borderStyle: 'dashed', borderColor: theme.colors.border, borderWidth: 1 }} accessibilityLabel={t('home.addCard')}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="Plus" color="textSecondary" size={22} />
              <Text variant="caption" color="textSecondary">
                {t('home.addCard')}
              </Text>
            </View>
          </Card>
        </View>

        {/* Rappel d'export */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing[6],
          }}
        >
          <Text variant="caption" color="textMuted">
            {exportDays === null
              ? t('home.neverExported')
              : t('home.lastExport', {
                  when: exportDays === 0 ? t('time.justNow') : t('time.daysAgo', { count: exportDays }),
                })}
          </Text>
          <Text
            variant="caption"
            color="brand"
            onPress={() => router.push('/(tabs)/reglages/donnees')}
            accessibilityRole="link"
          >
            {t('home.exportNow')}
          </Text>
        </View>
      </Screen>
      <Fab onPress={() => router.push('/saisie-rapide')} accessibilityLabel={t('home.quickAdd')} />
    </View>
  );
}
