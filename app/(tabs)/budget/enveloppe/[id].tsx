/** Enveloppe (référence) : « Budget mensuel / Courses », anneau du reste, actions, opérations du mois. */
import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ExpenseRow } from '@/features/budget/ExpenseRow';
import { useBudgetMonth, useCurrentMonthKey } from '@/features/budget/hooks';
import { shiftMonthKey } from '@/db/repositories';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { ActionIcon } from '@/ui/ActionIcon';
import { EmptyState } from '@/ui/EmptyState';
import { HeroRing } from '@/ui/HeroRing';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { PageHeader } from '@/ui/PageHeader';
import { PressableScale } from '@/ui/Pressable';
import { Screen } from '@/ui/Screen';
import { SectionHeader } from '@/ui/SectionHeader';
import { Text } from '@/ui/Text';
import { formatCents, formatMonthKey } from '@/utils/format';

export default function EnvelopeScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const currentKey = useCurrentMonthKey();
  const [monthKey, setMonthKey] = useState(currentKey);
  const month = useBudgetMonth(monthKey);
  const couple = useSettings((s) => s.couple);
  const [sort, setSort] = useState<'date' | 'amount'>('date');
  const total = month.categoryTotals.find((c) => c.category.id === id);
  const expenses = useMemo(
    () =>
      month.expenses
        .filter((e) => e.categoryId === id)
        .sort((a, b) => (sort === 'amount' ? b.amountCents - a.amountCents : a.date < b.date ? 1 : -1)),
    [month.expenses, id, sort],
  );
  if (!total) {
    return (
      <Screen>
        <PageHeader back label={t('budget.envelopeDetail')} title={t('budget.category')} />
      </Screen>
    );
  }
  const env = total.envelope;
  const remaining = env ? env.remainingCents : -total.totalCents;
  const ratio = env ? Math.max(0, 1 - env.usedPct / 100) : 0;
  const color = theme.chart[total.category.colorIndex % theme.chart.length] ?? theme.colors.brand;
  const monthTitle = formatMonthKey(monthKey).replace(/^./, (c) => c.toUpperCase());
  return (
    <Screen bottomInset={56}>
      <PageHeader back label={t('budget.envelopeDetail')} title={total.label} />
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
      <View style={{ marginTop: theme.spacing[5] }}>
        <HeroRing
          cents={env ? remaining : total.totalCents}
          ratio={env ? ratio : 1}
          caption={
            env
              ? t('budget.availableOutOfEnvelope', { total: formatCents(env.budgetCents) })
              : t('budget.noEnvelope')
          }
          size={250}
          accessibilityLabel={`${total.label} ${formatCents(remaining)}`}
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
          onPress={() => router.push({ pathname: '/(tabs)/budget/categorie/[id]', params: { id } })}
        />
      </View>
      <SectionHeader
        label={t('home.transactionsFor')}
        title={monthTitle}
        right={
          <PressableScale
            onPress={() => setSort(sort === 'date' ? 'amount' : 'date')}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={t('budget.sort')}
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
            <Text variant="callout">{sort === 'date' ? t('budget.sortDate') : t('budget.sortAmount')}</Text>
            <Icon name="ChevronDown" color="text" size={18} strokeWidth={2.25} />
          </PressableScale>
        }
      />
      {expenses.length === 0 ? (
        <EmptyState icon={total.category.icon} title={t('budget.noExpenses')} compact />
      ) : (
        expenses.map((e, i) => (
          <ExpenseRow
            key={e.id}
            expense={e}
            category={total.category}
            persons={month.persons}
            showPayer={couple}
            last={i === expenses.length - 1}
            onPress={() => router.push({ pathname: '/(tabs)/budget/depense/[id]', params: { id: e.id } })}
          />
        ))
      )}
      <View style={{ height: 1, backgroundColor: color, opacity: 0 }} />
    </Screen>
  );
}
