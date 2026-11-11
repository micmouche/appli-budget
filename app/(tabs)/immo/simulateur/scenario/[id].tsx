/** Scénario d'achat : hypothèses + synthèse calculée en direct. */
import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { createScenario, deleteScenario, getScenario, updateScenario } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { ResultRow } from '@/features/property/ResultRow';
import { computeScenario } from '@/features/property/logic';
import { usePersons } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { CurrencyInput, FormField, Input, NumberInput } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function ScenarioScreen(): React.JSX.Element {
  const p = useLocalSearchParams<{
    id: string;
    priceCents?: string;
    downPaymentCents?: string;
    rate?: string;
    insurance?: string;
    years?: string;
    incomeCents?: string;
    chargesCents?: string;
  }>();
  const isNew = p.id === 'new';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const existing = useQuery(() => (isNew ? undefined : getScenario(p.id)), [p.id, isNew]);
  const persons = usePersons();
  const householdIncome = persons.reduce((a, x) => a + x.monthlyIncomeCents, 0);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState<number | null>(
    existing?.priceCents ?? (p.priceCents ? Number(p.priceCents) : 250_000_00),
  );
  const [condition, setCondition] = useState<'old' | 'new'>(existing?.condition ?? 'old');
  const [increased, setIncreased] = useState(existing?.increasedDepartment ?? false);
  const [downPayment, setDownPayment] = useState<number | null>(
    existing?.downPaymentCents ?? (p.downPaymentCents ? Number(p.downPaymentCents) : 30_000_00),
  );
  const [rate, setRate] = useState<number | null>(
    existing ? existing.rateX100 / 100 : p.rate ? Number(p.rate) : 3.5,
  );
  const [insurance, setInsurance] = useState<number | null>(
    existing ? existing.insuranceX100 / 100 : p.insurance ? Number(p.insurance) : 0.34,
  );
  const [years, setYears] = useState<number | null>(
    existing ? Math.round(existing.months / 12) : p.years ? Number(p.years) : 20,
  );
  const [appFee, setAppFee] = useState<number | null>(existing?.applicationFeeCents ?? 1_000_00);
  const [guarantee, setGuarantee] = useState<number | null>(existing?.guaranteeFeeCents ?? 2_500_00);
  const [income, setIncome] = useState<number | null>(
    existing?.monthlyNetIncomeCents ?? (p.incomeCents ? Number(p.incomeCents) : householdIncome || 4_000_00),
  );
  const [charges, setCharges] = useState<number | null>(
    existing?.monthlyExistingChargesCents ?? (p.chargesCents ? Number(p.chargesCents) : 0),
  );

  const input = useMemo(
    () => ({
      priceCents: price ?? 0,
      condition,
      increasedDepartment: increased,
      downPaymentCents: downPayment ?? 0,
      rateX100: Math.round((rate ?? 0) * 100),
      insuranceX100: Math.round((insurance ?? 0) * 100),
      months: Math.max(1, Math.round((years ?? 20) * 12)),
      applicationFeeCents: appFee ?? 0,
      guaranteeFeeCents: guarantee ?? 0,
      monthlyNetIncomeCents: income ?? 0,
      monthlyExistingChargesCents: charges ?? 0,
    }),
    [price, condition, increased, downPayment, rate, insurance, years, appFee, guarantee, income, charges],
  );
  const r = useMemo(() => computeScenario(input), [input]);
  const tone = r.debtLevel === 'exceeded' ? 'negative' : r.debtLevel === 'warning' ? 'warning' : 'positive';
  const debtLabel =
    r.debtLevel === 'exceeded'
      ? t('property.debtExceeded')
      : r.debtLevel === 'warning'
        ? t('property.debtWarning')
        : t('property.debtOk');

  const save = (): void => {
    if (!name.trim() || (price ?? 0) <= 0) {
      haptics.error();
      return;
    }
    if (isNew) createScenario({ name, ...input });
    else updateScenario(p.id, { name, ...input });
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
          deleteScenario(p.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen keyboard>
      <SubScreenHeader
        title={isNew ? t('property.newScenario') : (existing?.name ?? t('property.editScenario'))}
      />
      <Card tone="brand" style={{ marginBottom: theme.spacing[3], borderWidth: 0 }}>
        <Text variant="caption" color="textSecondary">
          {t('property.totalMonthly')}
        </Text>
        <Amount cents={r.totalMonthlyCents} variant="display" />
        <Text variant="callout" color={tone} style={{ marginTop: 4 }}>
          {t('property.debtRatio')} {formatPct(r.debtRatioPct)} · {debtLabel}
        </Text>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[3] }}>
          {t('property.inputs')}
        </Text>
        <FormField label={t('property.scenarioName')}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="T3 à Villeurbanne, maison à Caluire…"
            autoFocus={isNew}
          />
        </FormField>
        <FormField label={t('property.price')}>
          <CurrencyInput valueCents={price} onChangeCents={setPrice} />
        </FormField>
        <FormField label={t('property.condition')}>
          <Segmented<'old' | 'new'>
            options={[
              { value: 'old', label: t('property.old') },
              { value: 'new', label: t('property.new') },
            ]}
            value={condition}
            onChange={setCondition}
          />
        </FormField>
        {condition === 'old' ? (
          <ListRow
            title={t('property.increasedDepartment')}
            right={
              <Switch
                value={increased}
                onValueChange={setIncreased}
                trackColor={{ true: theme.colors.brand }}
                accessibilityLabel={t('property.increasedDepartment')}
              />
            }
          />
        ) : null}
        <FormField label={t('property.downPayment')}>
          <CurrencyInput valueCents={downPayment} onChangeCents={setDownPayment} />
        </FormField>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.rate')}>
              <NumberInput value={rate} onChange={setRate} suffix="%" />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.duration')}>
              <NumberInput value={years} onChange={setYears} suffix={t('property.durationUnit')} integer />
            </FormField>
          </View>
        </View>
        <FormField label={t('property.insurance')} hint={t('property.insuranceHint')}>
          <NumberInput value={insurance} onChange={setInsurance} suffix="%" />
        </FormField>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.applicationFee')}>
              <CurrencyInput valueCents={appFee} onChangeCents={setAppFee} />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.guaranteeFee')}>
              <CurrencyInput valueCents={guarantee} onChangeCents={setGuarantee} />
            </FormField>
          </View>
        </View>
        <FormField label={t('property.netIncome')}>
          <CurrencyInput valueCents={income} onChangeCents={setIncome} />
        </FormField>
        <FormField label={t('property.existingCharges')}>
          <CurrencyInput valueCents={charges} onChangeCents={setCharges} />
        </FormField>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[2] }}>
          {t('property.summary')}
        </Text>
        <ResultRow label={t('property.notary')} value={formatCents(r.notary.totalCents)} />
        <ResultRow
          label={t('property.projectTotal')}
          value={formatCents(r.projectTotalCents, { compact: true })}
        />
        <ResultRow
          label={t('property.loanNeeded')}
          value={formatCents(r.principalCents, { compact: true })}
          strong
        />
        <ResultRow label={t('property.totalMonthly')} value={formatCents(r.totalMonthlyCents)} strong />
        <ResultRow
          label={t('property.totalInterest')}
          value={formatCents(r.loan?.totalInterestCents ?? 0, { compact: true })}
        />
        <ResultRow
          label={t('property.totalCost')}
          value={formatCents(r.loan?.totalCostCents ?? 0, { compact: true })}
          tone="negative"
        />
        <ResultRow label={t('property.taeg')} value={formatPct(r.loan?.taegPct ?? 0, 2)} />
        <ResultRow label={t('property.debtRatio')} value={formatPct(r.debtRatioPct)} tone={tone} strong />
        <ResultRow label={t('property.remainingToLive')} value={formatCents(r.remainingToLiveCents)} last />
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
      <View style={{ marginTop: theme.spacing[4] }}>
        <Disclaimer />
      </View>
    </Screen>
  );
}
