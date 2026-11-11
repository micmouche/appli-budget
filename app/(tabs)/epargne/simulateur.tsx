/** Simulateur d'intérêts composés (gratuit) ; création d'un objectif à partir du résultat (Premium). */
import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { compoundProjection } from '@/finance/compound';
import { usePremium } from '@/purchases';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { CurrencyInput, FormField, NumberInput } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { StatTile } from '@/ui/StatTile';
import { Text } from '@/ui/Text';
import { LineChart } from '@/ui/charts/LineChart';
import { formatCents } from '@/utils/format';

export default function CompoundSimulatorScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [initial, setInitial] = useState<number | null>(5_000_00);
  const [monthly, setMonthly] = useState<number | null>(200_00);
  const [rate, setRate] = useState<number | null>(3);
  const [years, setYears] = useState<number | null>(10);
  const [timing, setTiming] = useState<'start' | 'end'>('end');

  const result = useMemo(
    () =>
      compoundProjection({
        initialCents: initial ?? 0,
        contributionCents: monthly ?? 0,
        annualRatePct: rate ?? 0,
        years: Math.min(60, Math.max(0, years ?? 0)),
        contributionTiming: timing,
      }),
    [initial, monthly, rate, years, timing],
  );

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('savings.simulator')} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('savings.simInitial')}>
          <CurrencyInput valueCents={initial} onChangeCents={setInitial} />
        </FormField>
        <FormField label={t('savings.simMonthly')}>
          <CurrencyInput valueCents={monthly} onChangeCents={setMonthly} />
        </FormField>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          <View style={{ flex: 1 }}>
            <FormField label={t('savings.simRate')}>
              <NumberInput value={rate} onChange={setRate} suffix="%" />
            </FormField>
          </View>
          <View style={{ flex: 1 }}>
            <FormField label={t('savings.simYears')}>
              <NumberInput value={years} onChange={setYears} suffix={t('savings.simYearsUnit')} integer />
            </FormField>
          </View>
        </View>
        <FormField label={t('savings.simTiming')}>
          <Segmented<'start' | 'end'>
            options={[
              { value: 'end', label: t('savings.simEnd') },
              { value: 'start', label: t('savings.simStart') },
            ]}
            value={timing}
            onChange={setTiming}
          />
        </FormField>
      </Card>

      <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}>
        <StatTile
          label={t('savings.simFinal')}
          value={<Amount cents={result.finalCents} variant="title2" compact />}
          accent={theme.module.savings}
          icon="PiggyBank"
        />
        <StatTile
          label={t('savings.simInterest')}
          value={<Amount cents={result.totalInterestCents} variant="title2" compact color="positive" />}
          icon="Sparkles"
        />
      </View>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[2] }}>
          {t('savings.simContributed')} {formatCents(result.totalContributedCents, { compact: true })}
        </Text>
        <LineChart
          data={[
            { label: '0', value: initial ?? 0 },
            ...result.rows.map((r) => ({ label: String(r.year), value: r.totalCents })),
          ]}
          height={150}
          color={theme.module.savings}
          xLabels={5}
        />
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <Text variant="headline" style={{ marginBottom: theme.spacing[2] }}>
          {t('savings.simTable')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Text variant="micro" color="textMuted" style={{ width: 44 }}>
            {t('savings.simYear')}
          </Text>
          <Text variant="micro" color="textMuted" style={{ flex: 1, textAlign: 'right' }}>
            {t('savings.simContributed')}
          </Text>
          <Text variant="micro" color="textMuted" style={{ flex: 1, textAlign: 'right' }}>
            {t('savings.simInterest')}
          </Text>
          <Text variant="micro" color="textMuted" style={{ flex: 1, textAlign: 'right' }}>
            Total
          </Text>
        </View>
        {result.rows.map((r) => (
          <View key={r.year} style={{ flexDirection: 'row', paddingVertical: 6 }}>
            <Text variant="caption" tabular style={{ width: 44 }}>
              {r.year}
            </Text>
            <Text variant="caption" tabular color="textSecondary" style={{ flex: 1, textAlign: 'right' }}>
              {formatCents(r.contributedCents, { compact: true })}
            </Text>
            <Text variant="caption" tabular color="positive" style={{ flex: 1, textAlign: 'right' }}>
              {formatCents(r.interestCents, { compact: true })}
            </Text>
            <Text variant="caption" tabular style={{ flex: 1, textAlign: 'right' }}>
              {formatCents(r.totalCents, { compact: true })}
            </Text>
          </View>
        ))}
      </Card>
      <Button
        label={t('savings.simSaveGoal')}
        variant="secondary"
        icon={isPremium ? 'Target' : 'Crown'}
        onPress={() =>
          isPremium
            ? router.push({
                pathname: '/(tabs)/epargne/objectif/[id]',
                params: { id: 'new', targetCents: String(result.finalCents) },
              })
            : router.push({ pathname: '/paywall', params: { module: 'savings' } })
        }
        style={{ marginBottom: theme.spacing[3] }}
      />
      <Disclaimer />
    </Screen>
  );
}
