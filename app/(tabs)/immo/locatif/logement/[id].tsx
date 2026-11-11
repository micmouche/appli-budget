/** Logement : Loyers · Bail · Charges · Rentabilité. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { ResultRow } from '@/features/property/ResultRow';
import { StatusBadge } from '@/features/rental/StatusBadge';
import { useRentals } from '@/features/rental/hooks';
import { irlRevision } from '@/finance/rental';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Disclaimer } from '@/ui/Disclaimer';
import { EmptyState } from '@/ui/EmptyState';
import { FormField, NumberInput } from '@/ui/Form';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { formatCents, formatDate, formatMonthKey, formatPct } from '@/utils/format';

type Tab = 'rents' | 'lease' | 'charges' | 'yield';

export default function PropertyScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { views } = useRentals();
  const settings = useSettings();
  const view = views.find((v) => v.property.id === id);
  const [tab, setTab] = useState<Tab>('rents');
  const [newIrl, setNewIrl] = useState<number | null>(null);
  if (!view) {
    return (
      <Screen>
        <SubScreenHeader title={t('rental.title')} />
      </Screen>
    );
  }
  const { property, lease, payments, charges, yieldResult } = view;
  const revised =
    lease?.irlIndexX100 && newIrl ? irlRevision(lease.rentCents, lease.irlIndexX100 / 100, newIrl) : null;

  return (
    <Screen>
      <SubScreenHeader
        title={property.name}
        right={
          <IconButton
            name="Pencil"
            accessibilityLabel={t('rental.editProperty')}
            onPress={() => router.push({ pathname: '/(tabs)/immo/locatif/logement/editer', params: { id } })}
          />
        }
      />
      {property.address ? (
        <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
          {property.address}
        </Text>
      ) : null}
      <Segmented<Tab>
        options={[
          { value: 'rents', label: t('rental.tabRents') },
          { value: 'lease', label: t('rental.tabLease') },
          { value: 'charges', label: t('rental.tabCharges') },
          { value: 'yield', label: t('rental.tabYield') },
        ]}
        value={tab}
        onChange={setTab}
      />
      <View style={{ marginTop: theme.spacing[3] }}>
        {tab === 'rents' ? (
          payments.length === 0 ? (
            <Card>
              <EmptyState
                icon="Receipt"
                title={t('rental.noPayments')}
                body={lease ? undefined : t('rental.noLeaseHint')}
                compact
              />
            </Card>
          ) : (
            <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
              {payments.map((p, i) => (
                <ListRow
                  key={p.payment.id}
                  title={formatMonthKey(p.payment.periodKey)}
                  subtitle={
                    p.status === 'paid' && p.payment.paidAt
                      ? `${t('rental.paidOn')} ${formatDate(p.payment.paidAt)}`
                      : t('rental.dueOn', { date: formatDate(p.payment.dueDate) })
                  }
                  right={
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Amount cents={p.dueCents} variant="callout" />
                      <StatusBadge status={p.status} />
                    </View>
                  }
                  last={i === payments.length - 1}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/immo/locatif/loyer/[id]', params: { id: p.payment.id } })
                  }
                />
              ))}
            </Card>
          )
        ) : null}

        {tab === 'lease' ? (
          lease ? (
            <>
              <Card style={{ marginBottom: theme.spacing[3] }}>
                <Text variant="headline">{lease.tenantName}</Text>
                {lease.tenantEmail ? (
                  <Text variant="caption" color="textSecondary">
                    {lease.tenantEmail}
                  </Text>
                ) : null}
                <View style={{ marginTop: theme.spacing[2] }}>
                  <ResultRow label={t('rental.rent')} value={formatCents(lease.rentCents)} strong />
                  <ResultRow label={t('rental.charges')} value={formatCents(lease.chargesCents)} />
                  <ResultRow label={t('rental.deposit')} value={formatCents(lease.depositCents)} />
                  <ResultRow label={t('rental.startDate')} value={formatDate(lease.startDate)} />
                  <ResultRow label={t('rental.dueDay')} value={String(lease.dueDay)} />
                  <ResultRow
                    label={t('rental.furnished')}
                    value={lease.furnished ? t('common.yes') : t('common.no')}
                    last
                  />
                </View>
                <Button
                  label={t('rental.editLease')}
                  variant="secondary"
                  icon="Pencil"
                  style={{ marginTop: theme.spacing[3] }}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/immo/locatif/bail/[id]',
                      params: { id: lease.id, propertyId: id },
                    })
                  }
                />
              </Card>
              <Card>
                <Text variant="headline" style={{ marginBottom: theme.spacing[2] }}>
                  {t('rental.irlRevision')}
                </Text>
                <Text variant="caption" color="textSecondary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('rental.irlIndex')} : {lease.irlIndexX100 ? (lease.irlIndexX100 / 100).toFixed(2) : '—'}
                </Text>
                <FormField label={t('rental.irlNewIndex')}>
                  <NumberInput value={newIrl} onChange={setNewIrl} placeholder="146,80" />
                </FormField>
                {revised !== null ? (
                  <Text variant="headline" color="brand">
                    {t('rental.irlResult', { amount: formatCents(revised) })}
                  </Text>
                ) : null}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                icon="UserRound"
                title={t('rental.noLease')}
                body={t('rental.noLeaseHint')}
                compact
                actionLabel={t('rental.addLease')}
                onAction={() =>
                  router.push({
                    pathname: '/(tabs)/immo/locatif/bail/[id]',
                    params: { id: 'new', propertyId: id },
                  })
                }
              />
            </Card>
          )
        ) : null}

        {tab === 'charges' ? (
          <>
            <Button
              label={t('rental.addCharge')}
              icon="Plus"
              variant="secondary"
              style={{ marginBottom: theme.spacing[3] }}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/immo/locatif/charge/[id]',
                  params: { id: 'new', propertyId: id },
                })
              }
            />
            {charges.length === 0 ? (
              <Card>
                <EmptyState icon="Receipt" title={t('rental.noCharges')} compact />
              </Card>
            ) : (
              <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
                {charges.map((c, i) => (
                  <ListRow
                    key={c.id}
                    icon="Receipt"
                    title={c.note || t(`rental.natures.${c.nature}`)}
                    subtitle={`${formatDate(c.date)} · ${t(`rental.natures.${c.nature}`)}`}
                    right={<Amount cents={c.amountCents} variant="callout" />}
                    last={i === charges.length - 1}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/immo/locatif/charge/[id]',
                        params: { id: c.id, propertyId: id },
                      })
                    }
                  />
                ))}
              </Card>
            )}
          </>
        ) : null}

        {tab === 'yield' ? (
          yieldResult ? (
            <>
              <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}>
                {[
                  { label: t('rental.grossYield'), value: yieldResult.grossYieldPct },
                  { label: t('rental.netYield'), value: yieldResult.netYieldPct },
                  { label: t('rental.netNetYield'), value: yieldResult.netNetYieldPct },
                ].map((k) => (
                  <Card key={k.label} style={{ flex: 1 }}>
                    <Text variant="caption" color="textSecondary" numberOfLines={2}>
                      {k.label}
                    </Text>
                    <Text variant="title2" tabular>
                      {formatPct(k.value, 2)}
                    </Text>
                  </Card>
                ))}
              </View>
              <Card style={{ marginBottom: theme.spacing[3] }}>
                <ResultRow
                  label={t('rental.totalInvestment')}
                  value={formatCents(yieldResult.totalInvestmentCents, { compact: true })}
                />
                <ResultRow label={t('rental.annualRent')} value={formatCents(yieldResult.annualRentCents)} />
                <ResultRow label={t('rental.annualTax')} value={formatCents(yieldResult.annualTaxCents)} />
                <ResultRow
                  label={t('rental.cashflow')}
                  value={formatCents(yieldResult.monthlyCashflowCents)}
                  tone={yieldResult.monthlyCashflowCents < 0 ? 'negative' : 'positive'}
                  strong
                  last
                />
              </Card>
              <Card style={{ marginBottom: theme.spacing[3] }}>
                <FormField label={t('rental.taxRegime')}>
                  <Segmented<'micro' | 'reel'>
                    options={[
                      { value: 'micro', label: t('rental.micro') },
                      { value: 'reel', label: t('rental.reel') },
                    ]}
                    value={settings.rentalRegime}
                    onChange={(v) => settings.set('rentalRegime', v)}
                  />
                </FormField>
                <FormField label={t('rental.tmi')} hint={t('rental.tmiHint')}>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 11, 30, 41, 45].map((v) => (
                      <Chip
                        key={v}
                        label={`${v} %`}
                        selected={settings.rentalTmiPct === v}
                        onPress={() => settings.set('rentalTmiPct', v)}
                      />
                    ))}
                  </View>
                </FormField>
                <FormField label={t('rental.vacancy')}>
                  <NumberInput
                    value={settings.rentalVacancyWeeks}
                    onChange={(v) => settings.set('rentalVacancyWeeks', Math.max(0, Math.min(52, v ?? 0)))}
                    suffix={t('rental.vacancyUnit')}
                    integer
                  />
                </FormField>
              </Card>
              <Disclaimer />
            </>
          ) : (
            <Card>
              <EmptyState
                icon="TrendingUp"
                title={t('rental.noLease')}
                body={t('rental.noLeaseHint')}
                compact
              />
            </Card>
          )
        ) : null}
      </View>
    </Screen>
  );
}
