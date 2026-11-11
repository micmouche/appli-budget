/** Mensualité et coût total d'un prêt. */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ResultRow } from '@/features/property/ResultRow';
import { computeLoan } from '@/finance/loan';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { CurrencyInput, FormField, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';

export default function PaymentScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [principal, setPrincipal] = useState<number | null>(200_000_00);
  const [rate, setRate] = useState<number | null>(3.5);
  const [years, setYears] = useState<number | null>(20);
  const [insurance, setInsurance] = useState<number | null>(0.34);
  const [appFee, setAppFee] = useState<number | null>(1_000_00);
  const [guarantee, setGuarantee] = useState<number | null>(2_000_00);
  const months = Math.max(1, Math.round((years ?? 20) * 12));
  const result = useMemo(
    () =>
      computeLoan({
        principalCents: principal ?? 0,
        annualRatePct: rate ?? 0,
        months,
        insuranceAnnualPct: insurance ?? 0,
        applicationFeeCents: appFee ?? 0,
        guaranteeFeeCents: guarantee ?? 0,
      }),
    [principal, rate, months, insurance, appFee, guarantee],
  );

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('property.payment')} />
      <Card tone="brand" style={{ marginBottom: theme.spacing[3], borderWidth: 0 }}>
        <Text variant="caption" color="textSecondary">
          {t('property.totalMonthly')}
        </Text>
        <Amount cents={result.totalMonthlyCents} variant="display" />
        <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {t('property.totalCost')} {formatCents(result.totalCostCents, { compact: true })} ·{' '}
          {t('property.taeg')} {formatPct(result.taegPct, 2)}
        </Text>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('property.principal')}>
          <CurrencyInput valueCents={principal} onChangeCents={setPrincipal} />
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
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <ResultRow label={t('property.monthlyPayment')} value={formatCents(result.monthlyPaymentCents)} />
        <ResultRow label={t('property.monthlyInsurance')} value={formatCents(result.monthlyInsuranceCents)} />
        <ResultRow label={t('property.totalMonthly')} value={formatCents(result.totalMonthlyCents)} strong />
        <ResultRow label={t('property.totalInterest')} value={formatCents(result.totalInterestCents)} />
        <ResultRow label={t('property.totalInsurance')} value={formatCents(result.totalInsuranceCents)} />
        <ResultRow
          label={t('property.totalCost')}
          value={formatCents(result.totalCostCents)}
          strong
          tone="negative"
        />
        <ResultRow label={t('property.taeg')} value={formatPct(result.taegPct, 2)} last />
      </Card>
      <Button
        label={t('property.amortization')}
        variant="secondary"
        icon="Table"
        style={{ marginBottom: theme.spacing[3] }}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/immo/simulateur/amortissement',
            params: {
              principalCents: String(principal ?? 0),
              rate: String(rate ?? 0),
              months: String(months),
              insurance: String(insurance ?? 0),
            },
          })
        }
      />
      <Disclaimer />
    </Screen>
  );
}
