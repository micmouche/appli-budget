/** Logement : création / édition. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createProperty, deleteProperty, getProperty, updateProperty } from '@/db/repositories';
import { PROPERTY_TYPES, type PropertyType } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { CurrencyInput, FormField, Input, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { haptics } from '@/utils/haptics';

export default function PropertyEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getProperty(id)), [id, isNew]);
  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [type, setType] = useState<PropertyType>(existing?.type ?? 'apartment');
  const [surface, setSurface] = useState<number | null>(
    existing?.surfaceM2x10 ? existing.surfaceM2x10 / 10 : null,
  );
  const [price, setPrice] = useState<number | null>(existing?.purchasePriceCents ?? null);
  const [costs, setCosts] = useState<number | null>(existing?.acquisitionCostsCents ?? null);
  const [works, setWorks] = useState<number | null>(existing?.initialWorksCents ?? null);
  const [tax, setTax] = useState<number | null>(existing?.annualPropertyTaxCents ?? null);
  const [condo, setCondo] = useState<number | null>(existing?.annualCondoCents ?? null);
  const [insurance, setInsurance] = useState<number | null>(existing?.annualInsuranceCents ?? null);
  const [management, setManagement] = useState<number | null>(existing?.annualManagementCents ?? null);
  const [other, setOther] = useState<number | null>(existing?.annualOtherCents ?? null);
  const [loan, setLoan] = useState<number | null>(existing?.monthlyLoanPaymentCents ?? null);
  const [interest, setInterest] = useState<number | null>(existing?.annualLoanInterestCents ?? null);
  const [colorIndex, setColorIndex] = useState(existing?.colorIndex ?? 6);

  const save = (): void => {
    if (!name.trim()) {
      haptics.error();
      return;
    }
    const input = {
      name,
      address: address.trim(),
      type,
      surfaceM2x10: surface ? Math.round(surface * 10) : null,
      purchasePriceCents: price ?? 0,
      acquisitionCostsCents: costs ?? 0,
      initialWorksCents: works ?? 0,
      annualPropertyTaxCents: tax ?? 0,
      annualCondoCents: condo ?? 0,
      annualInsuranceCents: insurance ?? 0,
      annualManagementCents: management ?? 0,
      annualOtherCents: other ?? 0,
      monthlyLoanPaymentCents: loan ?? 0,
      annualLoanInterestCents: interest ?? 0,
      colorIndex,
    };
    if (isNew) {
      const created = createProperty(input);
      haptics.success();
      router.replace({ pathname: '/(tabs)/immo/locatif/logement/[id]', params: { id: created.id } });
      return;
    }
    updateProperty(id, input);
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
          deleteProperty(id);
          router.dismissTo('/(tabs)/immo/locatif');
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={isNew ? t('rental.addProperty') : t('rental.editProperty')} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('rental.propertyName')}>
          <Input value={name} onChangeText={setName} placeholder="T2 rue des Lilas" autoFocus={isNew} />
        </FormField>
        <FormField label={t('rental.address')}>
          <Input value={address} onChangeText={setAddress} placeholder="12 rue des Lilas, 44000 Nantes" />
        </FormField>
        <FormField label={t('rental.propertyType')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PROPERTY_TYPES.map((x) => (
              <Chip key={x} label={t(`rental.types.${x}`)} selected={type === x} onPress={() => setType(x)} />
            ))}
          </View>
        </FormField>
        <FormField label={t('rental.surface')}>
          <NumberInput value={surface} onChange={setSurface} suffix="m²" />
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
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[3] }}>
          {t('rental.totalInvestment')}
        </Text>
        <FormField label={t('rental.purchasePrice')}>
          <CurrencyInput valueCents={price} onChangeCents={setPrice} />
        </FormField>
        <FormField label={t('rental.acquisitionCosts')} hint={t('rental.acquisitionCostsHint')}>
          <CurrencyInput valueCents={costs} onChangeCents={setCosts} />
        </FormField>
        <FormField label={t('rental.initialWorks')}>
          <CurrencyInput valueCents={works} onChangeCents={setWorks} />
        </FormField>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[3] }}>
          {t('rental.annualCharges')}
        </Text>
        <FormField label={t('rental.propertyTax')}>
          <CurrencyInput valueCents={tax} onChangeCents={setTax} />
        </FormField>
        <FormField label={t('rental.condoFees')}>
          <CurrencyInput valueCents={condo} onChangeCents={setCondo} />
        </FormField>
        <FormField label={t('rental.pnoInsurance')}>
          <CurrencyInput valueCents={insurance} onChangeCents={setInsurance} />
        </FormField>
        <FormField label={t('rental.management')}>
          <CurrencyInput valueCents={management} onChangeCents={setManagement} />
        </FormField>
        <FormField label={t('rental.otherCharges')}>
          <CurrencyInput valueCents={other} onChangeCents={setOther} />
        </FormField>
        <FormField label={t('rental.loanPayment')}>
          <CurrencyInput valueCents={loan} onChangeCents={setLoan} />
        </FormField>
        <FormField label={t('rental.loanInterest')} hint={t('rental.loanInterestHint')}>
          <CurrencyInput valueCents={interest} onChangeCents={setInterest} />
        </FormField>
      </Card>
      <Button label={t('common.save')} onPress={save} />
      {!isNew ? (
        <Button
          label={t('common.delete')}
          variant="destructive"
          onPress={remove}
          style={{ marginTop: theme.spacing[2] }}
        />
      ) : null}
    </Screen>
  );
}
