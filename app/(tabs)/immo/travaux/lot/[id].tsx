/** Lot : nom, corps de métier, budget, TVA, dates. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createLot, deleteLot, getLot, updateLot } from '@/db/repositories';
import { LOT_KINDS, type LotKind } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { haptics } from '@/utils/haptics';

export default function LotScreen(): React.JSX.Element {
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getLot(id)), [id, isNew]);
  const [kind, setKind] = useState<LotKind>(existing?.kind ?? 'plumbing');
  const [name, setName] = useState(existing?.name ?? t('works.lotKinds.plumbing'));
  const [budget, setBudget] = useState<number | null>(existing?.budgetCents ?? null);
  const [vat, setVat] = useState<'200' | '100' | '55'>(
    String(existing?.vatRateX10 ?? 100) as '200' | '100' | '55',
  );
  const [hasDates, setHasDates] = useState(Boolean(existing?.startDate));
  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');

  const chooseKind = (k: LotKind): void => {
    setKind(k);
    if (isNew && LOT_KINDS.some((x) => t(`works.lotKinds.${x}`) === name)) setName(t(`works.lotKinds.${k}`));
  };
  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    const input = {
      projectId: existing?.projectId ?? projectId,
      name,
      kind,
      budgetCents: budget ?? 0,
      vatRateX10: Number(vat),
      startDate: hasDates && startDate ? startDate : null,
      endDate: hasDates && endDate ? endDate : null,
      done: existing?.done ?? false,
    };
    if (isNew) createLot(input);
    else updateLot(id, input);
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
          deleteLot(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('works.addLot') : t('works.editLot')} />
      <Card>
        <FormField label={t('works.lotKinds.other')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LOT_KINDS.map((k) => (
              <Chip
                key={k}
                label={t(`works.lotKinds.${k}`)}
                selected={kind === k}
                onPress={() => chooseKind(k)}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('works.lotName')}>
          <Input value={name} onChangeText={setName} />
        </FormField>
        <FormField label={t('works.lotBudget')}>
          <CurrencyInput valueCents={budget} onChangeCents={setBudget} />
        </FormField>
        <FormField label={t('works.vatRate')}>
          <Segmented<'200' | '100' | '55'>
            options={[
              { value: '200', label: '20 %' },
              { value: '100', label: '10 %' },
              { value: '55', label: '5,5 %' },
            ]}
            value={vat}
            onChange={setVat}
          />
        </FormField>
        <FormField label={t('works.planning')}>
          <Chip
            label={hasDates ? t('common.yes') : t('common.no')}
            icon="CalendarDays"
            selected={hasDates}
            onPress={() => setHasDates((v) => !v)}
          />
        </FormField>
        {hasDates ? (
          <>
            <FormField label={t('works.lotStart')}>
              <DateField value={startDate} onChange={setStartDate} />
            </FormField>
            <FormField label={t('works.lotEnd')}>
              <DateField value={endDate} onChange={setEndDate} />
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
