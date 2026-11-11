/** Récurrence : création ou édition. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { eq } from 'drizzle-orm';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { getDb } from '@/db/client';
import { categoryLabel, createRecurring, deleteRecurring, updateRecurring } from '@/db/repositories';
import { recurringExpenses, type Frequency } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useCategories, usePersons } from '@/features/budget/hooks';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function RecurringEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(
    () =>
      isNew ? undefined : getDb().select().from(recurringExpenses).where(eq(recurringExpenses.id, id)).get(),
    [id, isNew],
  );
  const categories = useCategories();
  const persons = usePersons();
  const couple = useSettings((s) => s.couple);

  const [amountCents, setAmountCents] = useState<number | null>(existing?.amountCents ?? null);
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? '');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'monthly');
  const [nextDate, setNextDate] = useState(existing?.nextDate ?? toIsoDate(new Date()));
  const [paidById, setPaidById] = useState<string | null>(existing?.paidById ?? persons[0]?.id ?? null);
  const [shared, setShared] = useState<'shared' | 'personal'>(
    existing?.shared === false ? 'personal' : 'shared',
  );
  const [note, setNote] = useState(existing?.note ?? '');

  const save = (): void => {
    if (amountCents === null || amountCents <= 0 || !categoryId || !nextDate) {
      haptics.error();
      return;
    }
    const input = {
      amountCents,
      categoryId,
      frequency,
      nextDate,
      paidById,
      shared: shared === 'shared',
      note,
    };
    if (isNew) createRecurring(input);
    else updateRecurring(id, input);
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
          deleteRecurring(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('budget.recurring')} />
      <Card>
        <FormField label={t('budget.note')}>
          <Input value={note} onChangeText={setNote} placeholder="Loyer, Netflix…" autoFocus={isNew} />
        </FormField>
        <FormField label={t('budget.amount')}>
          <CurrencyInput valueCents={amountCents} onChangeCents={setAmountCents} />
        </FormField>
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
        <FormField label={t('budget.recurrence')}>
          <Segmented<Frequency>
            options={[
              { value: 'weekly', label: t('budget.recurrenceWeekly') },
              { value: 'monthly', label: t('budget.recurrenceMonthly') },
              { value: 'yearly', label: t('budget.recurrenceYearly') },
            ]}
            value={frequency}
            onChange={setFrequency}
          />
        </FormField>
        <FormField label={t('budget.nextOccurrence', { date: '' }).replace(' : ', '')}>
          <DateField value={nextDate} onChange={setNextDate} />
        </FormField>
        {couple ? (
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
        <Button label={t('common.save')} onPress={save} />
        {!isNew ? (
          <Button
            label={t('common.delete')}
            variant="destructive"
            onPress={remove}
            style={{ marginTop: theme.spacing[2] }}
          />
        ) : null}
      </Card>
    </Screen>
  );
}
