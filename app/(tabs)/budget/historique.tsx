/** Analyses (référence « Analysis ») : période, total, comparaison, répartition, évolution, top des dépenses, charges récurrentes. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  categoryLabel,
  listAllExpenses,
  listRecurring,
  rangeForMonthKey,
  shiftMonthKey,
} from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import {
  useCategories,
  useCurrentMonthKey,
  useMonthlyTotals,
  usePersons,
  useScope,
} from '@/features/budget/hooks';
import { expenseInScope } from '@/features/budget/scope';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { Icon } from '@/ui/Icon';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { BarChart } from '@/ui/charts/BarChart';
import { DonutChart } from '@/ui/charts/DonutChart';
import {
  formatCents,
  formatDate,
  formatMonthKey,
  formatMonthShort,
  formatPct,
  splitEuros,
  toIsoDate,
} from '@/utils/format';

type Period = '1' | '6' | '12' | 'all';

export default function AnalysisScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const currentKey = useCurrentMonthKey();
  const monthStartDay = useSettings((s) => s.monthStartDay);
  const scope = useScope();
  const [period, setPeriod] = useState<Period>('6');
  const months = period === 'all' ? 24 : Number(period);
  const totals = useMonthlyTotals(currentKey, Math.max(6, months));
  const all = useQuery(() => listAllExpenses(), []);
  const recurring = useQuery(() => listRecurring(), []);
  const categories = useCategories();
  const persons = usePersons();

  const { expenses, previousCents } = useMemo(() => {
    const since =
      period === 'all'
        ? ''
        : toIsoDate(rangeForMonthKey(shiftMonthKey(currentKey, -(months - 1)), monthStartDay).start);
    const until = toIsoDate(rangeForMonthKey(currentKey, monthStartDay).end);
    const inScope = all.filter((e) => expenseInScope(e, scope));
    const current = inScope.filter((e) => e.date >= since && e.date < until);
    const prevRange = rangeForMonthKey(shiftMonthKey(currentKey, -1), monthStartDay);
    const previous = inScope.filter(
      (e) => e.date >= toIsoDate(prevRange.start) && e.date < toIsoDate(prevRange.end),
    );
    return { expenses: current, previousCents: previous.reduce((a, e) => a + e.amountCents, 0) };
  }, [all, scope, period, months, currentKey, monthStartDay]);

  const totalCents = expenses.reduce((a, e) => a + e.amountCents, 0);
  const monthCents = expenses
    .filter((e) => e.date >= toIsoDate(rangeForMonthKey(currentKey, monthStartDay).start))
    .reduce((a, e) => a + e.amountCents, 0);
  const variation =
    previousCents > 0 ? Math.round(((monthCents - previousCents) / previousCents) * 1000) / 10 : null;
  const slices = useMemo(() => {
    const by = new Map<string, number>();
    for (const e of expenses) by.set(e.categoryId, (by.get(e.categoryId) ?? 0) + e.amountCents);
    return categories
      .filter((c) => (by.get(c.id) ?? 0) > 0)
      .map((c) => ({
        id: c.id,
        label: categoryLabel(c),
        value: by.get(c.id) ?? 0,
        color: theme.chart[c.colorIndex % theme.chart.length] ?? theme.colors.brand,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories, theme]);
  const top = useMemo(
    () => [...expenses].sort((a, b) => b.amountCents - a.amountCents).slice(0, 5),
    [expenses],
  );
  const fixed = useMemo(
    () =>
      recurring
        .filter((r) => r.active && expenseInScope(r, scope))
        .map((r) => ({
          r,
          monthly:
            r.frequency === 'weekly'
              ? Math.round((r.amountCents * 52) / 12)
              : r.frequency === 'yearly'
                ? Math.round(r.amountCents / 12)
                : r.amountCents,
        }))
        .sort((a, b) => b.monthly - a.monthly),
    [recurring, scope],
  );
  const fixedCents = fixed.reduce((a, f) => a + f.monthly, 0);
  const { main, rest } = splitEuros(totalCents);
  const series = totals.slice(-Math.max(6, Math.min(12, months)));

  return (
    <Screen bottomInset={56}>
      <PageHeader back label={t(`budget.analysis.periods.${period}`)} title={t('budget.analysis.title')} />
      <Segmented<Period>
        options={[
          { value: '1', label: t('budget.analysis.month') },
          { value: '6', label: t('budget.analysis.six') },
          { value: '12', label: t('budget.analysis.twelve') },
          { value: 'all', label: t('budget.analysis.all') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <SectionHeader
        title={t('budget.analysis.synopsis')}
        onPress={() => router.push('/(tabs)/budget/operations')}
      />
      <Text variant="callout" color="textSecondary">
        {t('budget.analysis.totalSpent')}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {variation !== null ? (
          <>
            <Icon
              name={variation > 0 ? 'TrendingUp' : 'TrendingDown'}
              color={variation > 0 ? 'negative' : 'positive'}
              size={16}
              strokeWidth={2.2}
            />
            <Text variant="callout" tabular color={variation > 0 ? 'negative' : 'positive'}>
              {variation > 0 ? '+' : ''}
              {formatPct(variation)}
            </Text>
            <Text variant="callout" color="textSecondary">
              {t('budget.analysis.vsPrevious', { amount: formatCents(previousCents, { compact: true }) })}
            </Text>
          </>
        ) : (
          <Text variant="callout" color="textSecondary">
            {t('budget.transactions', { count: expenses.length })}
          </Text>
        )}
      </View>

      {/* Répartition */}
      <SectionHeader label={t('budget.analysis.title')} title={t('budget.byCategory')} />
      {slices.length === 0 ? (
        <Text variant="body" color="textSecondary">
          {t('budget.noExpenses')}
        </Text>
      ) : (
        <DonutChart
          slices={slices}
          centerLabel={t('budget.spent')}
          centerValue={formatCents(totalCents, { compact: true })}
          otherLabel={t('budget.otherCategories')}
          size={220}
          maxLegend={6}
        />
      )}

      {/* Évolution */}
      <SectionHeader label={t('home.monthToMonth')} title={t('home.spending')} />
      <BarChart
        data={series.map((m) => ({
          key: m.monthKey,
          label: formatMonthShort(m.monthKey).toUpperCase(),
          value: m.totalCents,
        }))}
        height={190}
        color={theme.colors.chartAccent}
        gradient
      />
      <View style={{ height: 2, backgroundColor: theme.colors.chartAccent, opacity: 0.8, marginTop: -2 }} />
      <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing[2] }}>
        {t('budget.analysis.average', {
          amount: formatCents(
            Math.round(
              series.filter((m) => m.count > 0).reduce((a, m) => a + m.totalCents, 0) /
                Math.max(1, series.filter((m) => m.count > 0).length),
            ),
          ),
        })}
      </Text>

      {/* Top des dépenses */}
      <SectionHeader label={t('budget.analysis.title')} title={t('budget.analysis.top')} />
      {top.length === 0 ? (
        <Text variant="body" color="textSecondary">
          {t('budget.noExpenses')}
        </Text>
      ) : (
        top.map((e, i) => {
          const cat = categories.find((c) => c.id === e.categoryId);
          const color = cat
            ? (theme.chart[cat.colorIndex % theme.chart.length] ?? theme.colors.brand)
            : theme.colors.textMuted;
          const payer = persons.length > 1 ? persons.find((p) => p.id === e.paidById)?.name : undefined;
          return (
            <PressableScale
              key={e.id}
              onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: e.id } })}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={`${cat ? categoryLabel(cat) : ''} ${formatCents(e.amountCents)}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
                paddingVertical: theme.spacing[3],
                borderBottomWidth: i === top.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <CategoryIcon icon={cat?.icon ?? 'CircleEllipsis'} color={color} size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="headline" numberOfLines={1}>
                  {e.note || (cat ? categoryLabel(cat) : '?')}
                </Text>
                <Text variant="callout" color="textSecondary">
                  {formatDate(e.date)}
                  {e.note && cat ? ` · ${categoryLabel(cat)}` : ''}
                  {payer ? ` · ${payer}` : ''}
                </Text>
              </View>
              <Amount cents={e.amountCents} variant="title2" />
            </PressableScale>
          );
        })
      )}

      {/* Charges récurrentes */}
      <SectionHeader
        label={t('budget.analysis.perMonth', { amount: formatCents(fixedCents) })}
        title={t('budget.recurring')}
        right={
          <Text
            variant="headline"
            color="brand"
            onPress={() => router.push('/(tabs)/budget/recurrences')}
            accessibilityRole="link"
          >
            {t('budget.analysis.manage')} »
          </Text>
        }
      />
      {fixed.length === 0 ? (
        <Text variant="body" color="textSecondary">
          {t('budget.analysis.noRecurring')}
        </Text>
      ) : (
        fixed.slice(0, 6).map(({ r, monthly }, i) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          const color = cat
            ? (theme.chart[cat.colorIndex % theme.chart.length] ?? theme.colors.brand)
            : theme.colors.textMuted;
          return (
            <PressableScale
              key={r.id}
              onPress={() =>
                router.push({ pathname: '/(tabs)/budget/recurrence/[id]', params: { id: r.id } })
              }
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={r.note ?? ''}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
                paddingVertical: theme.spacing[3],
                borderBottomWidth: i === Math.min(6, fixed.length) - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <CategoryIcon icon={cat?.icon ?? 'Repeat'} color={color} size={44} />
              <View style={{ flex: 1 }}>
                <Text variant="headline" numberOfLines={1}>
                  {r.note || (cat ? categoryLabel(cat) : '?')}
                </Text>
                <Text variant="callout" color="textSecondary">
                  {t(
                    r.frequency === 'weekly'
                      ? 'budget.recurrenceWeekly'
                      : r.frequency === 'yearly'
                        ? 'budget.recurrenceYearly'
                        : 'budget.recurrenceMonthly',
                  )}{' '}
                  · {Math.round((monthly / Math.max(1, fixedCents)) * 100)} %
                </Text>
              </View>
              <Amount cents={monthly} variant="title2" />
            </PressableScale>
          );
        })
      )}
      <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing[4] }}>
        {formatMonthKey(currentKey)}
      </Text>
    </Screen>
  );
}
