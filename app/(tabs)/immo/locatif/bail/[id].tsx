/** Bail : locataire, loyer, charges, dépôt, jour d'exigibilité, IRL, dates. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Switch } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createLease, deleteLease, getLease, updateLease } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { maxDepositCents } from '@/finance/rental';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input, NumberInput } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { formatCents, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function LeaseScreen(): React.JSX.Element {
  const { id, propertyId } = useLocalSearchParams<{ id: string; propertyId: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getLease(id)), [id, isNew]);
  const [tenantName, setTenantName] = useState(existing?.tenantName ?? '');
  const [tenantEmail, setTenantEmail] = useState(existing?.tenantEmail ?? '');
  const [startDate, setStartDate] = useState(existing?.startDate ?? toIsoDate(new Date()));
  const [hasEnd, setHasEnd] = useState(Boolean(existing?.endDate));
  const [endDate, setEndDate] = useState(existing?.endDate ?? toIsoDate(new Date()));
  const [rent, setRent] = useState<number | null>(existing?.rentCents ?? null);
  const [charges, setCharges] = useState<number | null>(existing?.chargesCents ?? null);
  const [deposit, setDeposit] = useState<number | null>(existing?.depositCents ?? null);
  const [dueDay, setDueDay] = useState<number | null>(existing?.dueDay ?? 1);
  const [furnished, setFurnished] = useState(existing?.furnished ?? false);
  const [irl, setIrl] = useState<number | null>(existing?.irlIndexX100 ? existing.irlIndexX100 / 100 : null);

  const save = (): void => {
    if (!tenantName.trim() || rent === null || rent <= 0 || !startDate) {
      haptics.error();
      return;
    }
    const input = {
      propertyId: existing?.propertyId ?? propertyId,
      tenantName,
      tenantEmail: tenantEmail.trim() || null,
      startDate,
      endDate: hasEnd ? endDate : null,
      rentCents: rent,
      chargesCents: charges ?? 0,
      depositCents: deposit ?? 0,
      dueDay: Math.min(28, Math.max(1, dueDay ?? 1)),
      furnished,
      irlIndexX100: irl ? Math.round(irl * 100) : null,
    };
    if (isNew) createLease(input);
    else updateLease(id, input);
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
          deleteLease(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('rental.addLease') : t('rental.editLease')} />
      <Card>
        <FormField label={t('rental.tenantName')}>
          <Input value={tenantName} onChangeText={setTenantName} autoFocus={isNew} />
        </FormField>
        <FormField label={t('rental.tenantEmail')}>
          <Input
            value={tenantEmail}
            onChangeText={setTenantEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>
        <FormField label={t('rental.rent')}>
          <CurrencyInput valueCents={rent} onChangeCents={setRent} />
        </FormField>
        <FormField label={t('rental.charges')}>
          <CurrencyInput valueCents={charges} onChangeCents={setCharges} />
        </FormField>
        <FormField
          label={t('rental.deposit')}
          hint={
            rent
              ? t('rental.depositMax', { amount: formatCents(maxDepositCents(rent, furnished)) })
              : undefined
          }
        >
          <CurrencyInput valueCents={deposit} onChangeCents={setDeposit} />
        </FormField>
        <FormField label={t('rental.dueDay')} hint={t('rental.dueDayHint')}>
          <NumberInput value={dueDay} onChange={setDueDay} integer />
        </FormField>
        <ListRow
          title={t('rental.furnished')}
          right={
            <Switch
              value={furnished}
              onValueChange={setFurnished}
              trackColor={{ true: theme.colors.brand }}
              accessibilityLabel={t('rental.furnished')}
            />
          }
        />
        <FormField label={t('rental.irlIndex')} hint={t('rental.irlIndexHint')}>
          <NumberInput value={irl} onChange={setIrl} placeholder="145,17" />
        </FormField>
        <FormField label={t('rental.startDate')}>
          <DateField value={startDate} onChange={setStartDate} />
        </FormField>
        <FormField label={t('rental.endDate')}>
          <Chip
            label={hasEnd ? t('common.yes') : t('common.no')}
            icon="CalendarDays"
            selected={hasEnd}
            onPress={() => setHasEnd((v) => !v)}
          />
          {hasEnd ? <DateField value={endDate} onChange={setEndDate} /> : null}
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
