/** Détail / édition d'une dépense. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { categoryLabel, deleteExpense, getExpense, restoreExpense, updateExpense } from '@/db/repositories';
import { ACCOUNT_ICONS } from '@/features/budget/AccountsStrip';
import { useAccounts, useCategories, usePersons } from '@/features/budget/hooks';
import { INCOME_SOURCES } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { showToast } from '@/ui/Toast';
import { haptics } from '@/utils/haptics';
import { DateField } from '@/features/budget/DateField';

export default function ExpenseDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const expense = useQuery(() => getExpense(id), [id]);
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);
  const { accounts } = useAccounts();

  const [amountCents, setAmountCents] = useState<number | null>(expense?.amountCents ?? null);
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '');
  const [date, setDate] = useState(expense?.date ?? '');
  const [paidById, setPaidById] = useState<string | null>(expense?.paidById ?? null);
  const [shared, setShared] = useState<'shared' | 'personal'>(
    expense?.shared === false ? 'personal' : 'shared',
  );
  const [note, setNote] = useState(expense?.note ?? '');
  const [accountId, setAccountId] = useState<string | null>(expense?.accountId ?? null);
  const [incomeSource, setIncomeSource] = useState(expense?.incomeSource ?? 'other');

  if (!expense) {
    return (
      <Screen>
        <SubScreenHeader title={t('budget.editExpense')} />
      </Screen>
    );
  }

  const save = (): void => {
    if (amountCents === null || amountCents <= 0 || !categoryId || !date) {
      haptics.error();
      return;
    }
    updateExpense(expense.id, { amountCents, categoryId, date, paidById, shared: shared === 'shared', note, accountId, incomeSource: expense.kind === 'income' ? incomeSource : undefined });
    haptics.success();
    router.back();
  };

  const remove = (): void => {
    Alert.alert(t('common.confirmDeleteTitle'), t('common.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          const removed = deleteExpense(expense.id);
          haptics.warning();
          showToast(t('budget.expenseDeleted'), {
            actionLabel: t('common.undo'),
            onAction: () => removed && restoreExpense(removed),
          });
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={expense.kind === 'expense' ? t('budget.editExpense') : t(`budget.kinds.${expense.kind}`)} />
      <Card>
        <FormField label={t('budget.amount')}>
          <CurrencyInput valueCents={amountCents} onChangeCents={setAmountCents} />
        </FormField>
        {expense.kind === 'income' ? (
          <FormField label={t('budget.income.source')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {INCOME_SOURCES.map((s) => (
                <Chip key={s} label={t(`budget.income.sources.${s}`)} selected={incomeSource === s} onPress={() => setIncomeSource(s)} />
              ))}
            </View>
          </FormField>
        ) : null}
        {accounts.length > 1 ? (
          <FormField label={expense.kind === 'transfer' ? t('budget.transfer.from') : t('budget.accounts.account')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {accounts.map((a) => (
                <Chip key={a.account.id} label={a.account.name} icon={ACCOUNT_ICONS[a.account.type]} selected={accountId === a.account.id} onPress={() => setAccountId(a.account.id)} />
              ))}
            </View>
          </FormField>
        ) : null}
        {expense.kind === 'expense' ? (
        <FormField label={t('budget.category')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={categoryLabel(c)}
                icon={c.icon}
                color={theme.chart[c.colorIndex % theme.chart.length]}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>
        </FormField>
        ) : null}
        <FormField label={t('budget.date')}>
          <DateField value={date} onChange={setDate} />
        </FormField>
        {couple && expense.kind === 'expense' ? (
          <>
            <FormField label={t('budget.paidBy')}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {persons.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    icon="User"
                    selected={paidById === p.id}
                    onPress={() => setPaidById(p.id)}
                  />
                ))}
              </View>
            </FormField>
            <FormField label={t('budget.splitMode')}>
              <Segmented<'shared' | 'personal'>
                options={[
                  { value: 'shared', label: t('budget.shared') },
                  { value: 'personal', label: t('budget.personal') },
                ]}
                value={shared}
                onChange={setShared}
              />
            </FormField>
          </>
        ) : null}
        <FormField label={t('budget.note')}>
          <Input value={note} onChangeText={setNote} placeholder={t('budget.notePlaceholder')} />
        </FormField>
        <Button label={t('common.save')} onPress={save} />
        <Button
          label={t('common.delete')}
          variant="destructive"
          onPress={remove}
          style={{ marginTop: theme.spacing[2] }}
        />
      </Card>
    </Screen>
  );
}
