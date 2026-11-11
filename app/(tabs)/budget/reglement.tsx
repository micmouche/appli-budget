/** Règlement du mois : détail par personne, transfert à effectuer, historique. */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { listSettlements, markSettled, shiftMonthKey, unmarkSettled } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { personName, useBudgetMonth, useCurrentMonthKey } from '@/features/budget/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { ListRow } from '@/ui/ListRow';
import { MonthSwitcher } from '@/ui/MonthSwitcher';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { formatCents, formatDate, formatMonthKey } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function SettlementScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const currentKey = useCurrentMonthKey();
  const [monthKey, setMonthKey] = useState(currentKey);
  const month = useBudgetMonth(monthKey);
  const history = useQuery(() => listSettlements(), []);
  const transfer = month.settlement.transfer;
  const record = month.settlementRecord;

  return (
    <Screen>
      <SubScreenHeader title={t('budget.settlement')} />
      <MonthSwitcher
        monthKey={monthKey}
        onChange={setMonthKey}
        shift={shiftMonthKey}
        canGoForward={monthKey < currentKey}
      />
      <Card style={{ marginTop: theme.spacing[3] }}>
        <Text variant="caption" color="textSecondary">
          {t('budget.shared')} · {formatCents(month.settlement.totalSharedCents)}
        </Text>
        <Text variant="title2" style={{ marginTop: 4 }}>
          {record
            ? t('budget.settledOn', { date: formatDate(record.settledAt) })
            : transfer
              ? t('budget.settlementOwes', {
                  from: personName(month.persons, transfer.fromId, '?'),
                  to: personName(month.persons, transfer.toId, '?'),
                  amount: formatCents(transfer.amountCents),
                })
              : t('budget.settlementBalanced')}
        </Text>
        <View style={{ marginTop: theme.spacing[3], gap: theme.spacing[2] }}>
          {month.settlement.perPerson.map((p) => (
            <View
              key={p.id}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View>
                <Text variant="headline">{personName(month.persons, p.id, '?')}</Text>
                <Text variant="caption" color="textSecondary">
                  {t('budget.paidBy')} {formatCents(p.paidCents)} · part {formatCents(p.owedShareCents)}
                </Text>
              </View>
              <Amount cents={p.balanceCents} variant="headline" colored signed />
            </View>
          ))}
        </View>
        {transfer && !record ? (
          <Button
            label={t('budget.markSettled')}
            icon="Check"
            style={{ marginTop: theme.spacing[4] }}
            onPress={() => {
              markSettled({
                monthKey,
                fromPersonId: transfer.fromId,
                toPersonId: transfer.toId,
                amountCents: transfer.amountCents,
              });
              haptics.success();
            }}
          />
        ) : null}
        {record ? (
          <Button
            label={t('common.undo')}
            variant="ghost"
            style={{ marginTop: theme.spacing[2] }}
            onPress={() => unmarkSettled(record.id)}
          />
        ) : null}
      </Card>
      {history.length > 0 ? (
        <>
          <Text variant="title2" style={{ marginTop: theme.spacing[5], marginBottom: theme.spacing[2] }}>
            {t('budget.history')}
          </Text>
          <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
            {history.map((h, i) => (
              <ListRow
                key={h.id}
                icon="ArrowLeftRight"
                title={formatMonthKey(h.monthKey)}
                subtitle={`${personName(month.persons, h.fromPersonId, '?')} → ${personName(month.persons, h.toPersonId, '?')} · ${formatDate(h.settledAt)}`}
                right={<Amount cents={h.amountCents} variant="callout" />}
                last={i === history.length - 1}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
