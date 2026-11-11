/** Dépense déductible d'un logement. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createCharge, deleteCharge, getCharge, updateCharge } from '@/db/repositories';
import { CHARGE_NATURES, type ChargeNature } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function ChargeScreen(): React.JSX.Element {
  const { id, propertyId } = useLocalSearchParams<{ id: string; propertyId: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getCharge(id)), [id, isNew]);
  const [nature, setNature] = useState<ChargeNature>(existing?.nature ?? 'propertyTax');
  const [amount, setAmount] = useState<number | null>(existing?.amountCents ?? null);
  const [date, setDate] = useState(existing?.date ?? toIsoDate(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');

  const save = (): void => {
    if (amount === null || amount <= 0) {
      haptics.error();
      return;
    }
    const input = { propertyId: existing?.propertyId ?? propertyId, nature, amountCents: amount, date, note };
    if (isNew) createCharge(input);
    else updateCharge(id, input);
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
          deleteCharge(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('rental.addCharge') : t('rental.editCharge')} />
      <Card>
        <FormField label={t('rental.chargeNature')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CHARGE_NATURES.map((n) => (
              <Chip
                key={n}
                label={t(`rental.natures.${n}`)}
                selected={nature === n}
                onPress={() => setNature(n)}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.amount')}>
          <CurrencyInput valueCents={amount} onChangeCents={setAmount} autoFocus={isNew} />
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
