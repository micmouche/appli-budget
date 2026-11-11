/** Frais de notaire : ancien / neuf, détail des composantes. */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ResultRow } from '@/features/property/ResultRow';
import { estimateNotaryFees } from '@/finance/notary';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { Disclaimer } from '@/ui/Disclaimer';
import { CurrencyInput, FormField } from '@/ui/Form';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { formatCents, formatPct } from '@/utils/format';

export default function NotaryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const [price, setPrice] = useState<number | null>(250_000_00);
  const [condition, setCondition] = useState<'old' | 'new'>('old');
  const [furniture, setFurniture] = useState<number | null>(null);
  const [increased, setIncreased] = useState(false);
  const r = useMemo(
    () =>
      estimateNotaryFees({
        priceCents: price ?? 0,
        condition,
        furnitureCents: furniture ?? 0,
        increasedDepartmentRate: increased,
      }),
    [price, condition, furniture, increased],
  );
  return (
    <Screen keyboard>
      <SubScreenHeader title={t('property.notary')} />
      <Card tone="brand" style={{ marginBottom: theme.spacing[3], borderWidth: 0 }}>
        <Text variant="caption" color="textSecondary">
          {t('property.notaryTotal')}
        </Text>
        <Amount cents={r.totalCents} variant="display" />
        <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {t('property.ofPrice', { pct: formatPct(r.totalPct, 2) })}
        </Text>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
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
        <FormField label={t('property.furniture')} hint={t('property.furnitureHint')}>
          <CurrencyInput valueCents={furniture} onChangeCents={setFurniture} placeholder="0,00" />
        </FormField>
        {condition === 'old' ? (
          <ListRow
            title={t('property.increasedDepartment')}
            last
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
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <ResultRow label={t('property.transferTax')} value={formatCents(r.transferTaxCents)} strong />
        <ResultRow label={t('property.fees')} value={formatCents(r.feesExclVatCents)} />
        <ResultRow label={t('property.feesVat')} value={formatCents(r.feesVatCents)} />
        <ResultRow
          label={t('property.securityContribution')}
          value={formatCents(r.securityContributionCents)}
        />
        <ResultRow label={t('property.disbursements')} value={formatCents(r.disbursementsCents)} />
        <ResultRow label={t('property.notaryTotal')} value={formatCents(r.totalCents)} strong last />
      </Card>
      <View style={{ marginBottom: theme.spacing[3] }} />
      <Disclaimer />
    </Screen>
  );
}
