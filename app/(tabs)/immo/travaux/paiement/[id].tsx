/** Paiement de travaux : libellé, type, lot, montant, date prévue, date de paiement. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import {
  createWorkPayment,
  deleteWorkPayment,
  getWorkPayment,
  listLots,
  updateWorkPayment,
} from '@/db/repositories';
import { WORK_PAYMENT_KINDS, type WorkPaymentKind } from '@/db/schema';
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

export default function WorkPaymentScreen(): React.JSX.Element {
  const { id, projectId } = useLocalSearchParams<{ id: string; projectId: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getWorkPayment(id)), [id, isNew]);
  const lots = useQuery(
    () => listLots().filter((l) => l.projectId === (existing?.projectId ?? projectId)),
    [projectId, existing?.projectId],
  );
  const [label, setLabel] = useState(existing?.label ?? t('works.paymentKinds.deposit'));
  const [kind, setKind] = useState<WorkPaymentKind>(existing?.kind ?? 'deposit');
  const [lotId, setLotId] = useState<string | null>(existing?.lotId ?? null);
  const [amount, setAmount] = useState<number | null>(existing?.amountCents ?? null);
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? toIsoDate(new Date()));
  const [paid, setPaid] = useState(Boolean(existing?.paidAt));
  const [paidAt, setPaidAt] = useState(existing?.paidAt ?? toIsoDate(new Date()));

  const save = (): void => {
    if (!label.trim() || amount === null || amount <= 0) {
      haptics.error();
      return;
    }
    const input = {
      projectId: existing?.projectId ?? projectId,
      lotId,
      label,
      kind,
      amountCents: amount,
      dueDate,
      paidAt: paid ? paidAt : null,
    };
    if (isNew) createWorkPayment(input);
    else updateWorkPayment(id, input);
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
          deleteWorkPayment(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('works.addPayment') : t('works.editPayment')} />
      <Card>
        <FormField label={t('works.paymentKinds.other')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WORK_PAYMENT_KINDS.map((k) => (
              <Chip
                key={k}
                label={t(`works.paymentKinds.${k}`)}
                selected={kind === k}
                onPress={() => {
                  setKind(k);
                  if (isNew) setLabel(t(`works.paymentKinds.${k}`));
                }}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('works.paymentLabel')}>
          <Input value={label} onChangeText={setLabel} />
        </FormField>
        {lots.length > 0 ? (
          <FormField label={t('works.lots')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="—" selected={lotId === null} onPress={() => setLotId(null)} />
              {lots.map((l) => (
                <Chip key={l.id} label={l.name} selected={lotId === l.id} onPress={() => setLotId(l.id)} />
              ))}
            </View>
          </FormField>
        ) : null}
        <FormField label={t('budget.amount')}>
          <CurrencyInput valueCents={amount} onChangeCents={setAmount} />
        </FormField>
        <FormField label={t('works.dueDate')}>
          <DateField value={dueDate} onChange={setDueDate} />
        </FormField>
        <FormField label={t('works.statusPaid')}>
          <Chip
            label={paid ? t('common.yes') : t('common.no')}
            icon="CircleCheck"
            selected={paid}
            onPress={() => setPaid((v) => !v)}
          />
        </FormField>
        {paid ? (
          <FormField label={t('works.paidDate')}>
            <DateField value={paidAt} onChange={setPaidAt} />
          </FormField>
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
