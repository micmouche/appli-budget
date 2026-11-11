/** Mouvement d'épargne : versement, retrait, intérêts. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import {
  createSavingsMovement,
  deleteSavingsMovement,
  getSavingsMovement,
  updateSavingsMovement,
} from '@/db/repositories';
import type { MovementType } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function MovementEditScreen(): React.JSX.Element {
  const { id, accountId } = useLocalSearchParams<{ id: string; accountId: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getSavingsMovement(id)), [id, isNew]);
  const [type, setType] = useState<MovementType>(existing?.type ?? 'deposit');
  const [amountCents, setAmountCents] = useState<number | null>(existing?.amountCents ?? null);
  const [date, setDate] = useState(existing?.date ?? toIsoDate(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');

  const save = (): void => {
    if (amountCents === null || amountCents <= 0 || !date) {
      haptics.error();
      return;
    }
    const input = { accountId: existing?.accountId ?? accountId, type, amountCents, date, note };
    if (isNew) createSavingsMovement(input);
    else updateSavingsMovement(id, input);
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
          deleteSavingsMovement(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('savings.addMovement') : t('savings.editMovement')} />
      <Card>
        <FormField label={t('savings.movementType')}>
          <Segmented<MovementType>
            options={[
              { value: 'deposit', label: t('savings.deposit') },
              { value: 'withdrawal', label: t('savings.withdrawal') },
              { value: 'interest', label: t('savings.interest') },
            ]}
            value={type}
            onChange={setType}
          />
        </FormField>
        <FormField label={t('budget.amount')}>
          <CurrencyInput valueCents={amountCents} onChangeCents={setAmountCents} autoFocus={isNew} />
        </FormField>
        <FormField label={t('budget.date')}>
          <DateField value={date} onChange={setDate} />
        </FormField>
        <FormField label={t('budget.note')}>
          <Input value={note} onChangeText={setNote} placeholder={t('budget.notePlaceholder')} />
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
