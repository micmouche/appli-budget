/** Budget : mois courant — solde, donut, enveloppes, règlement, liste des dépenses. */
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
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { MonthSwitcher } from '@/ui/MonthSwitcher';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { DonutChart } from '@/ui/charts/DonutChart';
import { formatCents, formatRelativeDay } from '@/utils/format';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';

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

  // Regroupement par jour
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const e of visible) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()];
  }, [visible]);

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
    <View style={{ flex: 1 }}>
      <Screen
        title={t('budget.title')}
        headerRight={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="Search"
              accessibilityLabel={t('budget.operations.title')}
              onPress={() => router.push('/(tabs)/budget/operations')}
            />
            <IconButton
              name="FileUp"
              accessibilityLabel={t('budget.import.title')}
              onPress={() => router.push('/(tabs)/budget/import')}
            />
            <IconButton
              name="ChartColumn"
              accessibilityLabel={t('budget.history')}
              onPress={() => router.push('/(tabs)/budget/historique')}
            />
            <IconButton
              name="Settings2"
              accessibilityLabel={t('budget.household')}
              onPress={() => router.push('/(tabs)/budget/foyer')}
            />
          </View>
        }
        bottomInset={72}
      >
        <MonthSwitcher
          monthKey={monthKey}
          onChange={setMonthKey}
          shift={shiftMonthKey}
          canGoForward={monthKey < currentKey}
        />

        {couple ? (
          <View style={{ marginTop: theme.spacing[3] }}>
            <ScopeSelector persons={month.persons} />
          </View>
        ) : null}
        <View style={{ marginTop: theme.spacing[3] }}>
          <AccountsStrip />
        </View>

        {/* Solde */}
        <Card style={{ marginTop: theme.spacing[3] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text variant="caption" color="textSecondary">
                {t('budget.spent')}
              </Text>
              <Amount cents={month.totalCents} variant="title1" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="caption" color="textSecondary">
                {t('budget.balance')}
              </Text>
              <Amount cents={month.balanceCents} variant="title2" colored />
            </View>
          </View>
          {month.incomeCents > 0 ? (
            <View style={{ marginTop: theme.spacing[3] }}>
              <ProgressBar
                value={month.totalCents / month.incomeCents}
                level={
                  month.totalCents > month.incomeCents
                    ? 'exceeded'
                    : month.totalCents > month.incomeCents * 0.8
                      ? 'warning'
                      : 'ok'
                }
              />
              <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                {t('budget.transactions', { count: month.expenses.length })} · {t('budget.dailyAverage')}{' '}
                {formatCents(
                  Math.round(
                    month.totalCents / Math.max(1, monthKey === currentKey ? new Date().getDate() : 30),
                  ),
                )}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Donut */}
        {slices.length > 0 ? (
          <Card style={{ marginTop: theme.spacing[3] }}>
            <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
              {t('budget.byCategory')}
            </Text>
            <DonutChart
              slices={slices}
              centerLabel={t('budget.spent')}
              centerValue={formatCents(month.totalCents, { compact: true })}
              otherLabel={t('budget.otherCategories')}
              size={170}
            />
          </Card>
        ) : null}

        {/* Règlement */}
        {couple && month.persons.length > 1 ? (
          <Card
            onPress={() => router.push('/(tabs)/budget/reglement')}
            style={{ marginTop: theme.spacing[3] }}
            accessibilityLabel={t('budget.settlement')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
              <Icon name="ArrowLeftRight" color="brand" size={22} />
              <View style={{ flex: 1 }}>
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
                <Text variant="caption" color="textSecondary">
                  {t('budget.settlement')}
                </Text>
              </View>
              <Icon name="ChevronRight" color="textMuted" size={20} />
            </View>
          </Card>
        ) : null}

        {/* Enveloppes */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing[5],
            marginBottom: theme.spacing[2],
          }}
        >
          <Text variant="title2">{t('budget.envelopes')}</Text>
          <Text
            variant="callout"
            color="brand"
            onPress={() => router.push('/(tabs)/budget/categories')}
            accessibilityRole="link"
          >
            {t('budget.categories')}
          </Text>
        </View>
        {envelopes.length > 0 ? (
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {envelopes.map((c, i) => {
              const color = theme.chart[c.category.colorIndex % theme.chart.length] ?? theme.colors.brand;
              return (
                <ListRow
                  key={c.category.id}
                  icon={c.category.icon}
                  iconColor={color}
                  title={c.label}
                  subtitle={`${formatCents(c.totalCents)} ${t('budget.ofBudget', { amount: formatCents(c.envelope!.budgetCents, { compact: true }) })}`}
                  last={i === envelopes.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/budget/categorie/[id]', params: { id: c.category.id } })
                  }
                  right={
                    <View style={{ width: 88 }}>
                      <ProgressBar
                        value={c.envelope!.usedPct / 100}
                        level={c.envelope!.level}
                        color={color}
                        height={6}
                      />
                      <Text
                        variant="caption"
                        color={c.envelope!.level === 'exceeded' ? 'negative' : 'textMuted'}
                        align="right"
                        style={{ marginTop: 4 }}
                      >
                        {Math.round(c.envelope!.usedPct)} %
                      </Text>
                    </View>
                  }
                />
              );
            })}
          </Card>
        ) : (
          <Card>
            <Text variant="callout" color="textSecondary">
              {t('budget.noBudget')} · {t('budget.setBudget')}
            </Text>
          </Card>
        )}

        {/* Dépenses */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing[5],
            marginBottom: theme.spacing[2],
          }}
        >
          <Text variant="title2">{t('budget.expensesList')}</Text>
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="FileSpreadsheet"
              accessibilityLabel={t('budget.exportCsv')}
              onPress={() => void doExport('csv')}
              size={20}
            />
            <IconButton
              name="FileText"
              accessibilityLabel={t('budget.exportPdf')}
              onPress={() => void doExport('pdf')}
              size={20}
            />
          </View>
        </View>
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
          <Card>
            <EmptyState
              icon="Receipt"
              title={t('budget.noExpenses')}
              body={t('budget.noExpensesHint')}
              compact
            />
          </Card>
        ) : (
          groups.map(([date, items]) => (
            <View key={date} style={{ marginBottom: theme.spacing[3] }}>
              <Text variant="micro" color="textMuted" style={{ marginBottom: 6, marginLeft: 4 }}>
                {formatRelativeDay(date)}
              </Text>
              <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
                {items.map((e, i) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    category={categoryById.get(e.categoryId)}
                    persons={month.persons}
                    showPayer={couple}
                    last={i === items.length - 1}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: e.id } })
                    }
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </Screen>
    </View>
  );
}
