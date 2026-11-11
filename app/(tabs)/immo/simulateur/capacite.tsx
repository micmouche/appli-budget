/** Capacité d'emprunt (règle HCSF). */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ResultRow } from '@/features/property/ResultRow';
import { SaveScenarioButton } from '@/features/property/SaveScenarioButton';
import { HCSF } from '@/finance/constants.fr';
import { borrowingCapacity } from '@/finance/loan';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { CurrencyInput, FormField, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';

export default function CapacityScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const [income, setIncome] = useState<number | null>(4_000_00);
  const [charges, setCharges] = useState<number | null>(0);
  const [ratio, setRatio] = useState<number | null>(HCSF.maxDebtRatioPct);
  const [rate, setRate] = useState<number | null>(3.5);
  const [insurance, setInsurance] = useState<number | null>(0.34);
  const [years, setYears] = useState<number | null>(20);
  const [downPayment, setDownPayment] = useState<number | null>(20_000_00);
  const [costsPct, setCostsPct] = useState<number | null>(8);

  const result = useMemo(
    () =>
      borrowingCapacity({
        monthlyNetIncomeCents: income ?? 0,
        monthlyExistingChargesCents: charges ?? 0,
        maxDebtRatioPct: ratio ?? HCSF.maxDebtRatioPct,
        annualRatePct: rate ?? 0,
        months: Math.max(1, Math.round((years ?? 20) * 12)),
        insuranceAnnualPct: insurance ?? 0,
        downPaymentCents: downPayment ?? 0,
        acquisitionCostsPct: costsPct ?? 0,
      }),
    [income, charges, ratio, rate, insurance, years, downPayment, costsPct],
  );

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('property.capacity')} />
      <Card tone="brand" style={{ marginBottom: theme.spacing[3], borderWidth: 0 }}>
        <Text variant="caption" color="textSecondary">
          {t('property.maxPrice')}
        </Text>
        <Amount cents={result.maxPropertyPriceCents} variant="display" compact />
        <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {t('property.maxMonthly')} {formatCents(result.maxTotalMonthlyCents)} ·{' '}
          {t('property.remainingToLive')} {formatCents(result.remainingToLiveCents, { compact: true })}
        </Text>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('property.netIncome')}>
          <CurrencyInput valueCents={income} onChangeCents={setIncome} />
        </FormField>
        <FormField label={t('property.existingCharges')} hint={t('property.existingChargesHint')}>
          <CurrencyInput valueCents={charges} onChangeCents={setCharges} />
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
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.insurance')}>
              <NumberInput value={insurance} onChange={setInsurance} suffix="%" />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t('property.maxDebtRatio')}>
              <NumberInput value={ratio} onChange={setRatio} suffix="%" />
            </FormField>
          </View>
        </View>
        <FormField label={t('property.downPayment')}>
          <CurrencyInput valueCents={downPayment} onChangeCents={setDownPayment} />
        </FormField>
        <FormField label={t('property.acquisitionCosts')} hint={t('property.acquisitionCostsHint')}>
          <NumberInput value={costsPct} onChange={setCostsPct} suffix="%" />
        </FormField>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <ResultRow label={t('property.currentRatio')} value={formatPct(result.currentDebtRatioPct)} />
        <ResultRow label={t('property.maxMonthly')} value={formatCents(result.maxTotalMonthlyCents)} />
        <ResultRow
          label={t('property.maxPrincipal')}
          value={formatCents(result.maxPrincipalCents, { compact: true })}
          strong
        />
        <ResultRow
          label={t('property.maxBudget')}
          value={formatCents(result.maxBudgetCents, { compact: true })}
        />
        <ResultRow
          label={t('property.maxPrice')}
          value={formatCents(result.maxPropertyPriceCents, { compact: true })}
          strong
        />
        <ResultRow
          label={t('property.remainingToLive')}
          value={formatCents(result.remainingToLiveCents)}
          last
        />
      </Card>
      <View style={{ marginBottom: theme.spacing[3] }}>
        <SaveScenarioButton
          params={{
            priceCents: String(result.maxPropertyPriceCents),
            downPaymentCents: String(downPayment ?? 0),
            rate: String(rate ?? 3.5),
            insurance: String(insurance ?? 0),
            years: String(years ?? 20),
            incomeCents: String(income ?? 0),
            chargesCents: String(charges ?? 0),
          }}
        />
      </View>
      <Disclaimer />
    </Screen>
  );
}
