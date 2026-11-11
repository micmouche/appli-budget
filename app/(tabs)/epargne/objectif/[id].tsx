/** Objectif d'épargne : création / édition + projection (versement conseillé, date d'atteinte). */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { addMonths } from 'date-fns';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoal,
  goalAccountIds,
  updateSavingsGoal,
} from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useSavings } from '@/features/savings/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/Pressable';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatDate, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

const GOAL_ICONS = [
  'Target',
  'House',
  'Plane',
  'Car',
  'Gem',
  'Baby',
  'Gift',
  'Umbrella',
  'GraduationCap',
  'Sparkles',
];

export default function GoalScreen(): React.JSX.Element {
  const { id, targetCents: presetTarget } = useLocalSearchParams<{ id: string; targetCents?: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getSavingsGoal(id)), [id, isNew]);
  const { accounts, goals } = useSavings();
  const summary = goals.find((g) => g.goal.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? 'Target');
  const [targetCents, setTargetCents] = useState<number | null>(
    existing?.targetCents ?? (presetTarget ? Number(presetTarget) : null),
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? toIsoDate(addMonths(new Date(), 12)));
  const [hasDate, setHasDate] = useState(existing ? existing.targetDate !== null : true);
  const [accountIds, setAccountIds] = useState<string[]>(existing ? goalAccountIds(existing) : []);
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 2);

  const save = (): void => {
    if (!name.trim() || targetCents === null || targetCents <= 0) {
      haptics.error();
      return;
    }
    const input = {
      name,
      icon,
      targetCents,
      targetDate: hasDate ? targetDate : null,
      accountIds,
      colorIndex,
    };
    if (isNew) createSavingsGoal(input);
    else updateSavingsGoal(id, input);
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
          deleteSavingsGoal(id);
          router.back();
        },
      },
    ]);
  };

  const p = summary?.projection;
  const color = theme.chart[colorIndex % theme.chart.length] ?? theme.colors.brand;

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('savings.addGoal') : (existing?.name ?? t('savings.editGoal'))} />
      {p ? (
        <Card style={{ marginBottom: theme.spacing[3] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Amount cents={p.currentCents} variant="title1" />
            <Text variant="callout" color="textSecondary">
              / {formatCents(p.targetCents, { compact: true })}
            </Text>
          </View>
          <View style={{ marginTop: theme.spacing[2] }}>
            <ProgressBar
              value={p.progressPct / 100}
              color={p.reached ? theme.colors.positiveFill : color}
              height={10}
            />
          </View>
          <View style={{ marginTop: theme.spacing[3], gap: 4 }}>
            {p.reached ? (
              <Text variant="headline" color="positive">
                {t('savings.goalReached')}
              </Text>
            ) : (
              <>
                {p.suggestedMonthlyCents !== null && p.monthsLeft !== null ? (
                  <Text variant="callout">
                    {t('savings.suggestedMonthly')} :{' '}
                    <Text variant="headline">{formatCents(p.suggestedMonthlyCents)}</Text> ·{' '}
                    {t('savings.monthsLeft', { count: p.monthsLeft })}
                  </Text>
                ) : null}
                <Text variant="caption" color="textSecondary">
                  {p.monthsAtCurrentPace === null
                    ? t('savings.projectedNever')
                    : t('savings.projectedDate', {
                        date: formatDate(addMonths(new Date(), p.monthsAtCurrentPace), 'MMM yyyy'),
                      })}
                </Text>
              </>
            )}
          </View>
        </Card>
      ) : null}
      <Card>
        <FormField label={t('savings.goalName')}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Apport appartement, Japon 2027…"
            autoFocus={isNew}
          />
        </FormField>
        <FormField label={t('savings.targetAmount')}>
          <CurrencyInput valueCents={targetCents} onChangeCents={setTargetCents} />
        </FormField>
        <FormField label={t('savings.targetDate')}>
          <View style={{ gap: 8 }}>
            <Chip
              label={hasDate ? t('common.yes') : t('common.no')}
              icon="CalendarDays"
              selected={hasDate}
              onPress={() => setHasDate((v) => !v)}
            />
            {hasDate ? <DateField value={targetDate} onChange={setTargetDate} /> : null}
          </View>
        </FormField>
        <FormField
          label={t('savings.linkedAccounts')}
          hint={accountIds.length === 0 ? t('savings.allAccounts') : undefined}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {accounts.map((a) => (
              <Chip
                key={a.account.id}
                label={a.account.name}
                selected={accountIds.includes(a.account.id)}
                onPress={() =>
                  setAccountIds((ids) =>
                    ids.includes(a.account.id)
                      ? ids.filter((x) => x !== a.account.id)
                      : [...ids, a.account.id],
                  )
                }
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.categoryIcon')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {GOAL_ICONS.map((ic) => (
              <PressableScale
                key={ic}
                onPress={() => setIcon(ic)}
                haptic="selection"
                accessibilityRole="radio"
                accessibilityLabel={ic}
                accessibilityState={{ selected: ic === icon }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ic === icon ? `${color}2A` : theme.colors.surface2,
                  borderColor: ic === icon ? color : 'transparent',
                }}
              >
                <Icon name={ic} color={ic === icon ? color : theme.colors.textSecondary} size={22} />
              </PressableScale>
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.categoryColor')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {theme.chart.map((c, i) => (
              <Chip
                key={c}
                label=" "
                color={c}
                selected={i === colorIndex}
                onPress={() => setColorIndex(i)}
              />
            ))}
          </View>
        </FormField>
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
