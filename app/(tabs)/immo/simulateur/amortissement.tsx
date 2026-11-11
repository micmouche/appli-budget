/** Tableau d'amortissement (par année ou par mois) avec export CSV / PDF (Premium). */
import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { exportAmortizationCsv, exportAmortizationPdf } from '@/features/property/export';
import { yearlyAmortization } from '@/features/property/logic';
import { computeLoan } from '@/finance/loan';
import { usePremium } from '@/purchases';
import { useTheme, type Theme } from '@/theme/ThemeProvider';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { IconButton } from '@/ui/IconButton';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents } from '@/utils/format';

export default function AmortizationScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    principalCents: string;
    rate: string;
    months: string;
    insurance: string;
  }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [mode, setMode] = useState<'years' | 'months'>('years');
  const input = useMemo(
    () => ({
      principalCents: Number(params.principalCents) || 0,
      annualRatePct: Number(params.rate) || 0,
      months: Math.max(1, Number(params.months) || 1),
      insuranceAnnualPct: Number(params.insurance) || 0,
    }),
    [params.principalCents, params.rate, params.months, params.insurance],
  );
  const loan = useMemo(() => computeLoan(input), [input]);
  const years = useMemo(() => yearlyAmortization(loan.schedule), [loan]);

  const doExport = async (kind: 'csv' | 'pdf'): Promise<void> => {
    if (!isPremium) {
      router.push({ pathname: '/paywall', params: { module: 'property' } });
      return;
    }
    try {
      if (kind === 'csv') await exportAmortizationCsv(loan, input);
      else await exportAmortizationPdf(loan, input);
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    }
  };

  const headerLabels = {
    interest: t('property.interest'),
    capital: t('property.capitalPart'),
    remaining: t('property.remaining'),
  };

  return (
    <Screen>
      <SubScreenHeader
        title={t('property.amortization')}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="FileSpreadsheet"
              accessibilityLabel="CSV"
              onPress={() => void doExport('csv')}
              size={20}
            />
            <IconButton
              name="FileText"
              accessibilityLabel="PDF"
              onPress={() => void doExport('pdf')}
              size={20}
            />
          </View>
        }
      />
      <Text variant="callout" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
        {formatCents(input.principalCents, { compact: true })} · {input.annualRatePct} % · {input.months}{' '}
        {t('property.month').toLowerCase()} · {formatCents(loan.totalMonthlyCents)} /{' '}
        {t('property.month').toLowerCase()}
      </Text>
      <Segmented<'years' | 'months'>
        options={[
          { value: 'years', label: t('property.showYears') },
          { value: 'months', label: t('property.showMonths') },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Card style={{ marginTop: theme.spacing[3], marginBottom: theme.spacing[3] }}>
        <TableHeader
          first={mode === 'years' ? t('savings.simYear') : t('property.month')}
          labels={headerLabels}
          theme={theme}
        />
        {mode === 'years'
          ? years.map((y) => (
              <TableRow
                key={y.year}
                k={String(y.year)}
                a={y.interestCents}
                b={y.principalCents}
                c={y.remainingCents}
              />
            ))
          : loan.schedule.map((r) => (
              <TableRow
                key={r.month}
                k={String(r.month)}
                a={r.interestCents}
                b={r.principalCents}
                c={r.remainingCents}
              />
            ))}
      </Card>
      <Disclaimer />
    </Screen>
  );
}

function TableHeader({
  first,
  labels,
  theme,
}: {
  first: string;
  labels: { interest: string; capital: string; remaining: string };
  theme: Theme;
}): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text variant="micro" color="textMuted" style={{ width: 44 }}>
        {first}
      </Text>
      <Text variant="micro" color="textMuted" style={{ flex: 1, textAlign: 'right' }}>
        {labels.interest}
      </Text>
      <Text variant="micro" color="textMuted" style={{ flex: 1, textAlign: 'right' }}>
        {labels.capital}
      </Text>
      <Text variant="micro" color="textMuted" style={{ flex: 1.2, textAlign: 'right' }}>
        {labels.remaining}
      </Text>
    </View>
  );
}

function TableRow({ k, a, b, c }: { k: string; a: number; b: number; c: number }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
      <Text variant="caption" tabular style={{ width: 44 }}>
        {k}
      </Text>
      <Text variant="caption" tabular color="negative" style={{ flex: 1, textAlign: 'right' }}>
        {formatCents(a, { compact: true })}
      </Text>
      <Text variant="caption" tabular color="positive" style={{ flex: 1, textAlign: 'right' }}>
        {formatCents(b, { compact: true })}
      </Text>
      <Text variant="caption" tabular style={{ flex: 1.2, textAlign: 'right' }}>
        {formatCents(c, { compact: true })}
      </Text>
    </View>
  );
}
