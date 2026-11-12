/** Budget (référence) : mois, anneau du reste à dépenser, actions, enveloppes, répartition, règlement, opérations. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AccountsStrip } from '@/features/budget/AccountsStrip';
import { ScopeSelector } from '@/features/budget/ScopeSelector';
import { ExpenseRow } from '@/features/budget/ExpenseRow';
import { exportMonthCsv, exportMonthPdf } from '@/features/budget/export';
import { personName, useBudgetMonth, useCurrentMonthKey } from '@/features/budget/hooks';
import { shiftMonthKey } from '@/db/repositories';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { ActionIcon } from '@/ui/ActionIcon';
import { Amount } from '@/ui/Amount';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { HeroRing } from '@/ui/HeroRing';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { DonutChart } from '@/ui/charts/DonutChart';
import { formatCents, formatMonthKey, formatRelativeDay } from '@/utils/format';

export default function BudgetScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const currentKey = useCurrentMonthKey();
  const [monthKey, setMonthKey] = useState(currentKey);
  const month = useBudgetMonth(monthKey);
  const couple = useSettings((s) => s.couple);
  const [filter, setFilter] = useState<string | null>(null);

  const slices = useMemo(
    () =>
      month.categoryTotals
        .filter((c) => c.totalCents > 0)
        .map((c) => ({
          id: c.category.id,
          label: c.label,
          value: c.totalCents,
          color: theme.chart[c.category.colorIndex % theme.chart.length] ?? theme.colors.brand,
        })),
    [month.categoryTotals, theme],
  );
  const envelopes = month.categoryTotals.filter((c) => c.envelope);
  const visible = filter ? month.expenses.filter((e) => e.categoryId === filter) : month.expenses;
  const categoryById = useMemo(() => new Map(month.categories.map((c) => [c.id, c])), [month.categories]);
  const transfer = month.settlement.transfer;
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const e of visible) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()];
  }, [visible]);
  const ratio = month.incomeCents > 0 ? Math.max(0, 1 - month.totalCents / month.incomeCents) : 0;
  const daily = Math.round(
    month.totalCents / Math.max(1, monthKey === currentKey ? new Date().getDate() : 30),
  );
  const monthTitle = formatMonthKey(monthKey).replace(/^./, (c) => c.toUpperCase());

  const doExport = async (kind: 'csv' | 'pdf'): Promise<void> => {
    try {
      if (kind === 'csv') await exportMonthCsv(monthKey, month.expenses, month.categories, month.persons);
      else
        await exportMonthPdf({
          monthKey,
          totalCents: month.totalCents,
          incomeCents: month.incomeCents,
          categoryTotals: month.categoryTotals,
          expenses: month.expenses,
          categories: month.categories,
          persons: month.persons,
          settlementText: transfer
            ? t('budget.settlementOwes', {
                from: personName(month.persons, transfer.fromId, '?'),
                to: personName(month.persons, transfer.toId, '?'),
                amount: formatCents(transfer.amountCents),
              })
            : null,
        });
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    }
  };

  return (
    <Screen bottomInset={56}>
      <PageHeader
        label={t('budget.title')}
        title={monthTitle}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="Search"
              color="brand"
              accessibilityLabel={t('budget.operations.title')}
              onPress={() => router.push('/(tabs)/budget/operations')}
            />
            <IconButton
              name="FileUp"
              color="brand"
              accessibilityLabel={t('budget.import.title')}
              onPress={() => router.push('/(tabs)/budget/import')}
            />
            <IconButton
              name="Settings2"
              color="brand"
              accessibilityLabel={t('budget.household')}
              onPress={() => router.push('/(tabs)/budget/foyer')}
              style={{ marginRight: -10 }}
            />
          </View>
        }
      />

      {/* Mois et périmètre */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing[3],
          marginTop: -theme.spacing[3],
        }}
      >
        <IconButton
          name="ChevronLeft"
          color="brand"
          accessibilityLabel={t('budget.previousMonth')}
          onPress={() => setMonthKey(shiftMonthKey(monthKey, -1))}
        />
        <Text variant="headline" color="textSecondary" style={{ minWidth: 150 }} align="center">
          {formatMonthKey(monthKey)}
        </Text>
        <IconButton
          name="ChevronRight"
          color="brand"
          accessibilityLabel={t('budget.nextMonth')}
          onPress={() => setMonthKey(shiftMonthKey(monthKey, 1))}
          disabled={monthKey >= currentKey}
        />
      </View>
      {couple ? (
        <View style={{ marginTop: theme.spacing[3], alignItems: 'center' }}>
          <ScopeSelector persons={month.persons} />
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing[5] }}>
        <HeroRing
          cents={month.balanceCents}
          ratio={ratio}
          caption={t('home.availableOutOf', { total: formatCents(month.incomeCents) })}
          size={250}
          accessibilityLabel={`${t('budget.remainingToSpend')} ${formatCents(month.balanceCents)}`}
        />
      </View>

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

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing[8] }}>
        <View style={{ flex: 1 }}>
          <Text variant="callout" color="textSecondary">
            {t('budget.spent')}
          </Text>
          <Amount cents={month.totalCents} variant="title2" />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="callout" color="textSecondary">
            {t('budget.dailyAverage')}
          </Text>
          <Amount cents={daily} variant="title2" />
        </View>
        <PressableScale
          onPress={() => router.push('/(tabs)/budget/recurrences')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('budget.recurring')}
          style={{ flex: 1, alignItems: 'flex-end' }}
        >
          <Text variant="callout" color="textSecondary">
            {t('budget.expensesList')}
          </Text>
          <Text variant="title2" tabular>
            {month.expenses.length}
          </Text>
        </PressableScale>
      </View>

      {/* Comptes */}
      <SectionHeader
        label={t('budget.accounts.title')}
        title={t('budget.accounts.balances')}
        onPress={() => router.push({ pathname: '/(tabs)/budget/compte/editer', params: { id: 'new' } })}
      />
      <AccountsStrip />

      {/* Règlement */}
      {couple && month.persons.length > 1 ? (
        <PressableScale
          onPress={() => router.push('/(tabs)/budget/reglement')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('budget.settlement')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[4],
            marginTop: theme.spacing[6],
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="ArrowLeftRight" color="brand" size={22} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="callout" color="textSecondary">
              {t('budget.settlement')}
            </Text>
            <Text variant="headline">
              {month.settlementRecord
                ? t('budget.settledOn', { date: formatRelativeDay(month.settlementRecord.settledAt) })
                : transfer
                  ? t('budget.settlementOwes', {
                      from: personName(month.persons, transfer.fromId, '?'),
                      to: personName(month.persons, transfer.toId, '?'),
                      amount: formatCents(transfer.amountCents),
                    })
                  : t('budget.settlementBalanced')}
            </Text>
          </View>
          <Icon name="ChevronRight" color="textMuted" size={20} />
        </PressableScale>
      ) : null}

      {/* Enveloppes */}
      <SectionHeader
        label={t('budget.title')}
        title={t('budget.envelopes')}
        right={
          <Text
            variant="headline"
            color="brand"
            onPress={() => router.push('/(tabs)/budget/categories')}
            accessibilityRole="link"
          >
            {t('budget.categories')} »
          </Text>
        }
      />
      {envelopes.length > 0 ? (
        envelopes.map((c, i) => {
          const color = theme.chart[c.category.colorIndex % theme.chart.length] ?? theme.colors.brand;
          const env = c.envelope!;
          return (
            <PressableScale
              key={c.category.id}
              onPress={() =>
                router.push({ pathname: '/(tabs)/budget/enveloppe/[id]', params: { id: c.category.id } })
              }
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={c.label}
              style={{
                paddingVertical: theme.spacing[3],
                borderBottomWidth: i === envelopes.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                <CategoryIcon icon={c.category.icon} color={color} size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="headline">{c.label}</Text>
                  <Text variant="callout" color="textSecondary">
                    {formatCents(c.totalCents)}{' '}
                    {t('budget.ofBudget', { amount: formatCents(env.budgetCents, { compact: true }) })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Amount cents={env.remainingCents} variant="title2" colored />
                  <Text
                    variant="caption"
                    color={
                      env.level === 'exceeded'
                        ? 'negative'
                        : env.level === 'warning'
                          ? 'warning'
                          : 'textMuted'
                    }
                  >
                    {env.level === 'exceeded' ? t('budget.exceeded') : `${Math.round(env.usedPct)} %`}
                  </Text>
                </View>
              </View>
              <ProgressBar value={env.usedPct / 100} level={env.level} color={color} height={6} />
            </PressableScale>
          );
        })
      ) : (
        <Text variant="body" color="textSecondary">
          {t('budget.noBudget')} · {t('budget.setBudget')}
        </Text>
      )}

      {/* Répartition */}
      {slices.length > 0 ? (
        <>
          <SectionHeader
            label={t('budget.byCategory')}
            title={t('budget.breakdown')}
            onPress={() => router.push('/(tabs)/budget/historique')}
          />
          <DonutChart
            slices={slices}
            centerLabel={t('budget.spent')}
            centerValue={formatCents(month.totalCents, { compact: true })}
            otherLabel={t('budget.otherCategories')}
            size={190}
          />
        </>
      ) : null}

      {/* Opérations */}
      <SectionHeader
        label={t('home.transactionsFor')}
        title={monthTitle}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="FileSpreadsheet"
              color="brand"
              accessibilityLabel={t('budget.exportCsv')}
              onPress={() => void doExport('csv')}
              size={22}
            />
            <IconButton
              name="FileText"
              color="brand"
              accessibilityLabel={t('budget.exportPdf')}
              onPress={() => void doExport('pdf')}
              size={22}
              style={{ marginRight: -10 }}
            />
          </View>
        }
      />
      {slices.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing[3] }}>
          {slices.slice(0, 6).map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              color={s.color}
              selected={filter === s.id}
              onPress={() => setFilter(filter === s.id ? null : s.id)}
            />
          ))}
        </View>
      ) : null}
      {visible.length === 0 ? (
        <EmptyState icon="Receipt" title={t('budget.noExpenses')} body={t('budget.noExpensesHint')} compact />
      ) : (
        groups.map(([date, items]) => (
          <View key={date} style={{ marginBottom: theme.spacing[3] }}>
            <Text variant="callout" color="textSecondary" style={{ marginBottom: 4 }}>
              {formatRelativeDay(date)}
            </Text>
            {items.map((e, i) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                category={categoryById.get(e.categoryId)}
                persons={month.persons}
                showPayer={couple}
                last={i === items.length - 1}
                onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: e.id } })}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
