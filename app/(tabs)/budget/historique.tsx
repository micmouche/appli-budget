/** Historique : barres des 12 derniers mois, moyenne, mois sélectionné. */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { useCurrentMonthKey, useMonthlyTotals } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { BarChart } from '@/ui/charts/BarChart';
import { formatCents, formatMonthKey, formatMonthShort } from '@/utils/format';

export default function HistoryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const currentKey = useCurrentMonthKey();
  const [range, setRange] = useState<'6' | '12'>('6');
  const totals = useMonthlyTotals(currentKey, Number(range));
  const [selected, setSelected] = useState(currentKey);
  const nonEmpty = totals.filter((m) => m.count > 0);
  const average = nonEmpty.length
    ? Math.round(nonEmpty.reduce((a, m) => a + m.totalCents, 0) / nonEmpty.length)
    : 0;
  const sel = totals.find((m) => m.monthKey === selected) ?? totals[totals.length - 1];

  return (
    <Screen>
      <SubScreenHeader title={t('budget.history')} />
      <Segmented<'6' | '12'>
        options={[
          { value: '6', label: t('budget.sixMonths') },
          { value: '12', label: t('budget.twelveMonths') },
        ]}
        value={range}
        onChange={setRange}
      />
      <Card style={{ marginTop: theme.spacing[3] }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing[3] }}
        >
          <View>
            <Text variant="caption" color="textSecondary">
              {sel ? formatMonthKey(sel.monthKey) : ''}
            </Text>
            <Amount cents={sel?.totalCents ?? 0} variant="title2" />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" color="textSecondary">
              Moyenne
            </Text>
            <Amount cents={average} variant="title2" color="textSecondary" />
          </View>
        </View>
        <BarChart
          data={totals.map((m) => ({
            key: m.monthKey,
            label: formatMonthShort(m.monthKey),
            value: m.totalCents,
          }))}
          selectedKey={sel?.monthKey}
          height={170}
        />
      </Card>
      <Card padded={false} style={{ paddingHorizontal: theme.spacing[4], marginTop: theme.spacing[3] }}>
        {[...totals].reverse().map((m, i, arr) => (
          <ListRow
            key={m.monthKey}
            title={formatMonthKey(m.monthKey)}
            subtitle={t('budget.transactions', { count: m.count })}
            right={
              <Amount
                cents={m.totalCents}
                variant="headline"
                color={m.totalCents > average && average > 0 ? 'negative' : 'text'}
              />
            }
            onPress={() => setSelected(m.monthKey)}
            last={i === arr.length - 1}
          />
        ))}
        {average > 0 ? (
          <Text variant="caption" color="textMuted" style={{ paddingVertical: theme.spacing[2] }}>
            Moyenne mensuelle : {formatCents(average)}
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}
