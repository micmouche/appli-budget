/** Devis : artisan, lot, montant HT, TVA, statut. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { acceptQuote, createQuote, deleteQuote, getQuote, listLots, updateQuote } from '@/db/repositories';
import { QUOTE_STATUSES, type QuoteStatus } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { inclVat } from '@/finance/works';
import { vatRateOf } from '@/features/works/logic';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { formatCents, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function QuoteScreen(): React.JSX.Element {
  const {
    id,
    projectId,
    lotId: presetLot,
  } = useLocalSearchParams<{ id: string; projectId: string; lotId?: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getQuote(id)), [id, isNew]);
  const lots = useQuery(
    () => listLots().filter((l) => l.projectId === (existing?.projectId ?? projectId)),
    [projectId, existing?.projectId],
  );
  const [lotId, setLotId] = useState(existing?.lotId ?? presetLot ?? lots[0]?.id ?? '');
  const [contractor, setContractor] = useState(existing?.contractor ?? '');
  const [amount, setAmount] = useState<number | null>(existing?.amountExclVatCents ?? null);
  const [vat, setVat] = useState<'200' | '100' | '55'>(
    String(existing?.vatRateX10 ?? lots.find((l) => l.id === lotId)?.vatRateX10 ?? 100) as
      | '200'
      | '100'
      | '55',
  );
  const [status, setStatus] = useState<QuoteStatus>(existing?.status ?? 'received');
  const [date, setDate] = useState(existing?.date ?? toIsoDate(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');
  const ttc = amount !== null ? inclVat(amount, vatRateOf(Number(vat))) : null;

  const save = (): void => {
    if (!contractor.trim() || amount === null || amount <= 0 || !lotId) {
      haptics.error();
      return;
    }
    const input = {
      projectId: existing?.projectId ?? projectId,
      lotId,
      contractor,
      amountExclVatCents: amount,
      vatRateX10: Number(vat),
      status,
      date,
      note,
    };
    const row = isNew ? createQuote(input) : (updateQuote(id, input), { id });
    if (status === 'accepted') acceptQuote(row.id);
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
          deleteQuote(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('works.addQuote') : t('works.editQuote')} />
      <Card>
        <FormField label={t('works.lots')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {lots.map((l) => (
              <Chip
                key={l.id}
                label={l.name}
                selected={lotId === l.id}
                onPress={() => {
                  setLotId(l.id);
                  setVat(String(l.vatRateX10) as '200' | '100' | '55');
                }}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('works.contractor')}>
          <Input
            value={contractor}
            onChangeText={setContractor}
            placeholder="Plomberie Martin"
            autoFocus={isNew}
          />
        </FormField>
        <FormField label={t('works.amountExclVat')}>
          <CurrencyInput valueCents={amount} onChangeCents={setAmount} />
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
        {ttc !== null ? (
          <Text variant="headline" style={{ marginBottom: theme.spacing[4] }}>
            {t('works.amountInclVat')} : {formatCents(ttc)}
          </Text>
        ) : null}
        <FormField label={t('works.quoteStatus')}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {QUOTE_STATUSES.map((s) => (
              <Chip
                key={s}
                label={t(`works.statuses.${s}`)}
                selected={status === s}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>
        </FormField>
        <FormField label={t('budget.date')}>
          <DateField value={date} onChange={setDate} />
        </FormField>
        <FormField label={t('budget.note')}>
          <Input value={note} onChangeText={setNote} placeholder={t('budget.notePlaceholder')} />
        </FormField>
        <Button label={status === 'accepted' ? t('works.acceptQuote') : t('common.save')} onPress={save} />
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
