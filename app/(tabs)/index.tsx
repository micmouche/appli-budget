/** Accueil : reste à dépenser, indicateurs, enveloppes, dernières opérations, conseil, cartes optionnelles. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { differenceInDays } from 'date-fns';

import { setDemoMode } from '@/core/bootstrap';
import { categoryLabel, listRecurring, shiftMonthKey } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { ScopeSelector } from '@/features/budget/ScopeSelector';
import { useAccounts, useBudgetMonth, useCurrentMonthKey, useScope, personName } from '@/features/budget/hooks';
import { expenseInScope, incomeInScope } from '@/features/budget/scope';
import { useSavings } from '@/features/savings/hooks';
import { useScenarios } from '@/features/property/hooks';
import { useRentals } from '@/features/rental/hooks';
import { useWorks } from '@/features/works/hooks';
import { usePremium } from '@/purchases';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeCardId } from '@/store/settings';
import { Amount } from '@/ui/Amount';
import { BalanceCard } from '@/ui/BalanceCard';
import { Banner } from '@/ui/Banner';
import { Card } from '@/ui/Card';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { Fab } from '@/ui/Fab';
import { Icon } from '@/ui/Icon';
import { InsightCard } from '@/ui/InsightCard';
import { ListRow } from '@/ui/ListRow';
import { PressableScale } from '@/ui/Pressable';
import { ProgressBar } from '@/ui/Progress';
import { Avatar, AvatarGroup } from '@/ui/avatar/Avatar';
import { Screen } from '@/ui/Screen';
import { StatTile } from '@/ui/StatTile';
import { Text } from '@/ui/Text';
import { formatCents, formatDate, formatMonthKey, formatPct, formatRelativeDay } from '@/utils/format';

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing[6], marginBottom: theme.spacing[3] }}>
      <Text variant="title2">{title}</Text>
      {action && onAction ? (
        <Text variant="callout" color="brand" onPress={onAction} accessibilityRole="link">
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const monthKey = useCurrentMonthKey();
  const scope = useScope();
  const month = useBudgetMonth(monthKey);
  const previous = useBudgetMonth(shiftMonthKey(monthKey, -1));
  const { accounts } = useAccounts();
  const recurring = useQuery(() => listRecurring(), []);
  const homeCards = useSettings((s) => s.homeCards);
  const demoMode = useSettings((s) => s.demoMode);
  const couple = useSettings((s) => s.couple);
  const [{ daysLeft, elapsedPct }] = useState(() => {
    const now = new Date();
    const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { daysLeft: total - now.getDate() + 1, elapsedPct: now.getDate() / total };
  });
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
  const variation = previous.totalCents > 0 ? Math.round(((month.totalCents - previous.totalCents) / previous.totalCents) * 1000) / 10 : null;

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

  /** Charges fixes mensuelles du périmètre (récurrences actives, ramenées au mois). */
  const fixedCents = useMemo(
    () =>
      recurring
        .filter((r) => r.active && expenseInScope(r, scope))
        .reduce((a, r) => a + (r.frequency === 'weekly' ? Math.round((r.amountCents * 52) / 12) : r.frequency === 'yearly' ? Math.round(r.amountCents / 12) : r.amountCents), 0),
    [recurring, scope],
  );
  const goalsAvgPct = savings.goals.length ? Math.round(savings.goals.reduce((a, g) => a + Math.min(100, g.projection.progressPct), 0) / savings.goals.length) : null;
  const envelopes = month.categoryTotals.filter((c) => c.totalCents > 0 || c.envelope).slice(0, 4);
  const recent = useMemo(
    () =>
      month.transactions
        .filter((tx) => (tx.kind === 'expense' ? expenseInScope(tx, scope) : tx.kind === 'income' ? incomeInScope(tx, scope, accounts.map((a) => a.account)) : scope === 'all'))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [month.transactions, scope, accounts],
  );

  /** Conseil contextualisé, calculé sur les données réelles. */
  const insight = useMemo(() => {
    if (month.incomeCents <= 0 && month.totalCents <= 0) {
      return { tone: 'lavender' as const, icon: 'Sparkles', title: t('home.insight.empty'), body: t('home.insight.emptyBody'), onPress: () => router.push('/saisie-rapide') };
    }
    if (month.incomeCents <= 0) {
      return { tone: 'accent' as const, icon: 'Wallet', title: t('home.insight.noBudget'), body: t('home.insight.noBudgetBody'), onPress: () => router.push('/(tabs)/budget/foyer') };
    }
    const spentPct = month.totalCents / month.incomeCents;
    const top = month.categoryTotals[0];
    if (spentPct > elapsedPct + 0.15 && top) {
      return {
        tone: 'accent' as const,
        icon: 'TriangleExclamationPoint',
        title: t('home.insight.fast'),
        body: t('home.insight.fastBody', { spent: formatPct(Math.round(spentPct * 100), 0), elapsed: formatPct(Math.round(elapsedPct * 100), 0), category: top.label }),
        onPress: () => router.push('/(tabs)/budget'),
      };
    }
    const perDay = daysLeft > 0 ? Math.round(Math.max(0, month.balanceCents) / daysLeft) : 0;
    return {
      tone: 'brand' as const,
      icon: 'ThumbsUp',
      title: t('home.insight.good'),
      body: t('home.insight.goodBody', { remaining: formatCents(month.balanceCents), days: daysLeft, perDay: formatCents(perDay) }),
      onPress: () => router.push('/(tabs)/budget'),
    };
  }, [month, elapsedPct, daysLeft, router, t]);

  const exportDays = lastExportAt ? differenceInDays(new Date(), new Date(lastExportAt)) : null;
  const scopeLabel = scope === 'shared' ? t('budget.scope.sharedOnly') : scope === 'all' ? t('budget.remainingToSpend') : t('budget.scope.personalOf', { name: personName(month.persons, scope.slice(2), '') });
  const optionalCards = homeCards.filter((m) => m !== 'topCategory' && m !== 'savings');

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title={greeting}
        subtitle={subtitle}
        headerRight={
          <PressableScale onPress={() => router.push('/(tabs)/reglages')} haptic="light" accessibilityRole="button" accessibilityLabel={t('profile.profiles')}>
            <AvatarGroup persons={month.persons} size={38} />
          </PressableScale>
        }
        bottomInset={72}
      >
        {demoMode ? (
          <View style={{ marginBottom: theme.spacing[3] }}>
            <Banner tone="info" icon="FlaskConical" title={t('home.demoBanner')} actionLabel={t('home.demoBannerAction')} onAction={() => setDemoMode(false)} />
          </View>
        ) : null}

        {couple ? (
          <View style={{ marginBottom: theme.spacing[3] }}>
            <ScopeSelector persons={month.persons} />
          </View>
        ) : null}

        <BalanceCard
          label={scopeLabel}
          remainingCents={month.balanceCents}
          budgetCents={month.incomeCents}
          spentCents={month.totalCents}
          daysLeft={daysLeft}
          variationPct={variation}
          onPress={() => router.push('/(tabs)/budget')}
        />

        {/* Indicateurs secondaires */}
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
          <StatTile
            label={t('home.totalSavings')}
            icon="PiggyBank"
            accent={theme.module.savings}
            value={<Amount cents={savings.totalCents} variant="title2" compact />}
            caption={t('home.savingsCaption', { count: savings.accounts.length })}
            onPress={() => router.push('/(tabs)/epargne')}
            style={{ minHeight: 104, padding: theme.spacing[3] }}
          />
          <StatTile
            label={t('home.fixedCharges')}
            icon="Repeat"
            accent={theme.colors.accent}
            value={<Amount cents={fixedCents} variant="title2" compact />}
            caption={t('home.perMonth')}
            onPress={() => router.push('/(tabs)/budget/recurrences')}
            style={{ minHeight: 104, padding: theme.spacing[3] }}
          />
          <StatTile
            label={t('home.goals')}
            icon="Target"
            accent={theme.colors.lavender}
            value={goalsAvgPct === null ? '—' : formatPct(goalsAvgPct, 0)}
            caption={goalsAvgPct === null ? t('home.noGoals') : t('home.goalsCaption', { done: savings.goals.filter((g) => g.projection.reached).length, total: savings.goals.length })}
            onPress={() => router.push('/(tabs)/epargne')}
            style={{ minHeight: 104, padding: theme.spacing[3] }}
          />
        </View>

        {/* Conseil et alertes */}
        <View style={{ gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
          {alerts.slice(0, 2).map((a) => (
            <InsightCard key={a.key} tone={a.tone === 'negative' ? 'negative' : a.tone === 'warning' ? 'accent' : 'lavender'} icon={a.tone === 'negative' ? 'CircleAlert' : a.tone === 'warning' ? 'TriangleExclamationPoint' : 'Info'} title={a.title} onPress={a.onPress} />
          ))}
          <InsightCard tone={insight.tone} icon={insight.icon} title={insight.title} body={insight.body} onPress={insight.onPress} />
        </View>

        {/* Enveloppes */}
        <SectionTitle title={t('home.envelopes')} action={t('home.seeBudget')} onAction={() => router.push('/(tabs)/budget')} />
        {envelopes.length === 0 ? (
          <Card>
            <Text variant="caption" color="textSecondary">
              {t('budget.noExpenses')}
            </Text>
          </Card>
        ) : (
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[1] }}>
            {envelopes.map((c, i) => {
              const color = theme.chart[c.category.colorIndex % theme.chart.length] ?? theme.colors.brand;
              const budget = c.category.budgetCents ?? 0;
              const ratio = budget > 0 ? c.totalCents / budget : month.totalCents > 0 ? c.totalCents / month.totalCents : 0;
              return (
                <PressableScale
                  key={c.category.id}
                  onPress={() => router.push({ pathname: '/(tabs)/budget/categorie/[id]', params: { id: c.category.id } })}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel={c.label}
                  style={{ paddingVertical: theme.spacing[3], borderBottomWidth: i === envelopes.length - 1 ? 0 : 1, borderBottomColor: theme.colors.border, gap: 8 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                    <CategoryIcon icon={c.category.icon} color={color} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text variant="headline">{c.label}</Text>
                      <Text variant="caption" color="textSecondary">
                        {budget > 0 ? t('budget.spentOf', { spent: formatCents(c.totalCents, { compact: true }), total: formatCents(budget, { compact: true }) }) : t('budget.noBudget')}
                      </Text>
                    </View>
                    <Amount cents={budget > 0 ? budget - c.totalCents : c.totalCents} variant="headline" colored={budget > 0} />
                  </View>
                  <ProgressBar value={ratio} level={c.envelope?.level ?? 'ok'} color={color} height={6} />
                </PressableScale>
              );
            })}
          </Card>
        )}

        {/* Dernières opérations */}
        <SectionTitle title={t('home.recent')} action={t('home.seeAll')} onAction={() => router.push('/(tabs)/budget/operations')} />
        {recent.length === 0 ? (
          <Card>
            <Text variant="caption" color="textSecondary">
              {t('home.noRecent')}
            </Text>
          </Card>
        ) : (
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {recent.map((op, i) => {
              const cat = month.categories.find((c) => c.id === op.categoryId);
              const color = cat ? (theme.chart[cat.colorIndex % theme.chart.length] ?? theme.colors.brand) : theme.colors.textMuted;
              const payer = month.persons.find((p) => p.id === op.paidById);
              const title = op.kind === 'income' ? t(`budget.income.sources.${op.incomeSource ?? 'other'}`) : op.kind === 'transfer' ? t('budget.kinds.transfer') : cat ? categoryLabel(cat) : '?';
              return (
                <ListRow
                  key={op.id}
                  left={<CategoryIcon icon={op.kind === 'income' ? 'ArrowDownToLine' : op.kind === 'transfer' ? 'ArrowLeftRight' : (cat?.icon ?? 'CircleEllipsis')} color={op.kind === 'income' ? theme.colors.positive : op.kind === 'transfer' ? theme.colors.info : color} size={36} />}
                  title={title}
                  subtitle={[formatRelativeDay(op.date), op.note].filter(Boolean).join(' · ')}
                  right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Amount cents={op.kind === 'income' ? op.amountCents : -op.amountCents} variant="headline" colored={op.kind === 'income'} signed={op.kind === 'income'} />
                      {couple && payer ? <Avatar person={payer} size={22} /> : null}
                    </View>
                  }
                  last={i === recent.length - 1}
                  onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: op.id } })}
                />
              );
            })}
          </Card>
        )}

        {/* Cartes optionnelles (Loyers, Travaux, Immo, première catégorie) */}
        {true ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3], marginTop: theme.spacing[6] }}>
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
            <Card
              onPress={() => router.push('/(tabs)/reglages/accueil')}
              tone="surface2"
              style={{ minWidth: '47%', flex: 1, minHeight: 104, borderStyle: 'dashed', borderColor: theme.colors.border, borderWidth: 1 }}
              accessibilityLabel={t('home.addCard')}
            >
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="Plus" color="textSecondary" size={22} />
                <Text variant="caption" color="textSecondary">
                  {t('home.addCard')}
                </Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Rappel d'export */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing[6] }}>
          <Text variant="caption" color="textMuted">
            {exportDays === null ? t('home.neverExported') : t('home.lastExport', { when: exportDays === 0 ? t('time.justNow') : t('time.daysAgo', { count: exportDays }) })}
          </Text>
          <Text variant="caption" color="brand" onPress={() => router.push('/(tabs)/reglages/donnees')} accessibilityRole="link">
            {t('home.exportNow')}
          </Text>
        </View>
      </Screen>
      <Fab onPress={() => router.push('/saisie-rapide')} accessibilityLabel={t('home.quickAdd')} />
    </View>
  );
}
