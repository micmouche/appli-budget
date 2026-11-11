/** Foyer : seul ou à deux, prénoms, revenus, mode de répartition, début du mois budgétaire. */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ensureHousehold, upsertPerson } from '@/db/repositories';
import { usePersons } from '@/features/budget/hooks';
import { shareOf, type SplitMode } from '@/finance/budget';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CurrencyInput, FormField, Input, NumberInput } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { haptics } from '@/utils/haptics';

export default function HouseholdScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettings();
  const persons = usePersons();

  const [couple, setCouple] = useState(settings.couple);
  const [names, setNames] = useState<[string, string]>([
    persons[0]?.name ?? t('common.me'),
    persons[1]?.name ?? t('budget.person2'),
  ]);
  const [incomes, setIncomes] = useState<[number | null, number | null]>([
    persons[0]?.monthlyIncomeCents ?? null,
    persons[1]?.monthlyIncomeCents ?? null,
  ]);
  const [splitMode, setSplitMode] = useState<SplitMode>(settings.splitMode);
  const [customPct, setCustomPct] = useState<number | null>(settings.customPctPerson1);
  const [monthStartDay, setMonthStartDay] = useState<number | null>(settings.monthStartDay);

  const preview = shareOf(
    100_00,
    [
      { id: 'a', monthlyIncomeCents: incomes[0] ?? 0 },
      { id: 'b', monthlyIncomeCents: incomes[1] ?? 0 },
    ],
    { mode: splitMode, customPctPerson1: customPct ?? 50 },
  );

  const save = (): void => {
    const day = Math.min(28, Math.max(1, monthStartDay ?? 1));
    settings.patch({
      couple,
      splitMode,
      customPctPerson1: Math.min(100, Math.max(0, customPct ?? 50)),
      monthStartDay: day,
    });
    const list = ensureHousehold(couple, [names[0] || t('common.me'), names[1] || t('budget.person2')]);
    list.forEach((p, i) =>
      upsertPerson({ id: p.id, name: names[i] ?? p.name, monthlyIncomeCents: incomes[i] ?? 0, position: i }),
    );
    haptics.success();
    router.back();
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('budget.household')} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <ListRow
          icon="Users"
          title={t('budget.couple')}
          last
          right={
            <Switch
              value={couple}
              onValueChange={setCouple}
              trackColor={{ true: theme.colors.brand }}
              accessibilityLabel={t('budget.couple')}
            />
          }
        />
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[3] }}>
          {t('budget.income')}
        </Text>
        {[0, 1].slice(0, couple ? 2 : 1).map((i) => (
          <View key={i}>
            <FormField label={i === 0 ? t('budget.person1') : t('budget.person2')}>
              <Input
                value={names[i]}
                onChangeText={(v) => setNames((n) => (i === 0 ? [v, n[1]] : [n[0], v]))}
                placeholder={t('budget.personName')}
              />
            </FormField>
            <FormField label={t('budget.monthlyIncome')}>
              <CurrencyInput
                valueCents={incomes[i] ?? null}
                onChangeCents={(v) => setIncomes((c) => (i === 0 ? [v, c[1]] : [c[0], v]))}
              />
            </FormField>
          </View>
        ))}
      </Card>
      {couple ? (
        <Card style={{ marginBottom: theme.spacing[3] }}>
          <FormField label={t('budget.splitMode')}>
            <Segmented<SplitMode>
              options={[
                { value: 'equal', label: t('budget.splitEqual') },
                { value: 'prorata', label: t('budget.splitProrata') },
                { value: 'custom', label: t('budget.splitCustom') },
              ]}
              value={splitMode}
              onChange={setSplitMode}
            />
          </FormField>
          {splitMode === 'custom' ? (
            <FormField label={t('budget.splitCustomPct', { name: names[0] })}>
              <NumberInput value={customPct} onChange={setCustomPct} suffix="%" integer />
            </FormField>
          ) : null}
          <Text variant="callout" color="textSecondary">
            {t('budget.splitPreview', {
              name1: names[0],
              pct1: Math.round((preview[0] ?? 0) / 100),
              name2: names[1],
              pct2: Math.round((preview[1] ?? 0) / 100),
            })}
          </Text>
        </Card>
      ) : null}
      <Card style={{ marginBottom: theme.spacing[4] }}>
        <FormField label={t('budget.monthStartDay')} hint={t('budget.monthStartDayHint')}>
          <NumberInput value={monthStartDay} onChange={setMonthStartDay} integer placeholder="1" />
        </FormField>
      </Card>
      <Button label={t('common.save')} onPress={save} />
      <Button
        label={t('budget.recurring')}
        variant="secondary"
        icon="Repeat"
        onPress={() => router.push('/(tabs)/budget/recurrences')}
        style={{ marginTop: theme.spacing[2] }}
      />
    </Screen>
  );
}
