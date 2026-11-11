/** Échéance de loyer : encaissement total ou partiel, quittance PDF. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { getLease, getPayment, getProperty, recordPayment } from '@/db/repositories';
import { useQuery } from '@/db/useQuery';
import { DateField } from '@/features/budget/DateField';
import { ResultRow } from '@/features/property/ResultRow';
import { StatusBadge } from '@/features/rental/StatusBadge';
import { exportReceiptPdf } from '@/features/rental/export';
import { paymentStatus, toIso, totalDue } from '@/features/rental/logic';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CurrencyInput, FormField } from '@/ui/Form';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents, formatDate, formatMonthKey } from '@/utils/format';
import { haptics } from '@/utils/haptics';

export default function RentPaymentScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const graceDays = useSettings((s) => s.rentalGraceDays);
  const payment = useQuery(() => getPayment(id), [id]);
  const lease = useQuery(() => (payment ? getLease(payment.leaseId) : undefined), [payment?.leaseId]);
  const property = useQuery(
    () => (payment ? getProperty(payment.propertyId) : undefined),
    [payment?.propertyId],
  );
  const [paid, setPaid] = useState<number | null>(payment?.paidCents || null);
  const [paidAt, setPaidAt] = useState(payment?.paidAt ?? toIso(new Date()));
  if (!payment || !lease || !property) {
    return (
      <Screen>
        <SubScreenHeader title={t('rental.payment')} />
      </Screen>
    );
  }
  const due = totalDue(payment);
  const status = paymentStatus(payment, toIso(new Date()), graceDays);

  const save = (amount: number): void => {
    recordPayment(id, amount, paidAt);
    haptics.success();
    router.back();
  };
  const receipt = async (): Promise<void> => {
    try {
      await exportReceiptPdf(payment, lease, property);
    } catch {
      showToast(t('common.error'), { icon: 'CircleExclamationPoint' });
    }
  };

  return (
    <Screen keyboard>
      <SubScreenHeader title={t('rental.paymentOf', { month: formatMonthKey(payment.periodKey) })} />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="caption" color="textSecondary">
              {property.name} · {lease.tenantName}
            </Text>
            <Amount cents={due} variant="title1" />
          </View>
          <StatusBadge status={status} />
        </View>
        <View style={{ marginTop: theme.spacing[2] }}>
          <ResultRow label={t('rental.rent')} value={formatCents(payment.rentCents)} />
          <ResultRow label={t('rental.charges')} value={formatCents(payment.chargesCents)} />
          <ResultRow label={t('rental.dueOn', { date: formatDate(payment.dueDate) })} value=" " />
          <ResultRow label={t('rental.amountPaid')} value={formatCents(payment.paidCents)} strong last />
        </View>
      </Card>
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <FormField label={t('rental.amountPaid')}>
          <CurrencyInput valueCents={paid} onChangeCents={setPaid} />
        </FormField>
        <FormField label={t('rental.paidOn')}>
          <DateField value={paidAt} onChange={setPaidAt} />
        </FormField>
        <Button label={t('rental.collectAll')} icon="CircleCheck" onPress={() => save(due)} />
        <Button
          label={t('common.save')}
          variant="secondary"
          style={{ marginTop: theme.spacing[2] }}
          onPress={() => save(paid ?? 0)}
        />
        {payment.paidCents > 0 ? (
          <Button
            label={t('rental.markUnpaid')}
            variant="ghost"
            style={{ marginTop: theme.spacing[2] }}
            onPress={() => save(0)}
          />
        ) : null}
      </Card>
      {payment.paidCents > 0 ? (
        <Button
          label={payment.paidCents >= due ? t('rental.receipt') : t('rental.partialReceipt')}
          icon="FileText"
          variant="secondary"
          onPress={() => void receipt()}
        />
      ) : null}
    </Screen>
  );
}
