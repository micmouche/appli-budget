/** Chantier : Lots · Devis · Paiements · Planning · Synthèse. */
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { SubScreenHeader } from '@/core/SubScreenHeader';
import { updateLot, updateWorkPayment } from '@/db/repositories';
import { ResultRow } from '@/features/property/ResultRow';
import { exportProjectPdf } from '@/features/works/export';
import { useWorks } from '@/features/works/hooks';
import { lotSpan, planningWeeks, quoteInclVat } from '@/features/works/logic';
import { useTheme } from '@/theme/ThemeProvider';
import { Amount } from '@/ui/Amount';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { ListRow } from '@/ui/ListRow';
import { PressableScale } from '@/ui/Pressable';
import { ProgressBar } from '@/ui/Progress';
import { Screen } from '@/ui/Screen';
import { TabChips } from '@/ui/TabChips';
import { Text } from '@/ui/Text';
import { showToast } from '@/ui/Toast';
import { formatCents, formatDate, formatPct, toIsoDate } from '@/utils/format';
import { haptics } from '@/utils/haptics';

type Tab = 'lots' | 'quotes' | 'payments' | 'planning' | 'summary';

export default function ProjectScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const view = useWorks().find((v) => v.project.id === id);
  const [tab, setTab] = useState<Tab>('lots');
  if (!view) {
    return (
      <Screen>
        <SubScreenHeader title={t('works.title')} />
      </Screen>
    );
  }
  const { project, lots, payments, totals } = view;
  const plan = planningWeeks(lots.map((l) => l.lot));
  const statusColor = {
    paid: theme.colors.positive,
    late: theme.colors.negative,
    due: theme.colors.warning,
    planned: theme.colors.textMuted,
  };
  const statusLabel = {
    paid: t('works.statusPaid'),
    late: t('works.statusLate'),
    due: t('works.statusDue'),
    planned: t('works.statusPlanned'),
  };
  const levelTone =
    totals.level === 'exceeded' ? 'negative' : totals.level === 'warning' ? 'warning' : 'positive';

  return (
    <Screen>
      <SubScreenHeader
        title={project.name}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              name="FileText"
              accessibilityLabel={t('works.exportSummary')}
              onPress={() => void exportProjectPdf(view).catch(() => showToast(t('common.error')))}
            />
            <IconButton
              name="Pencil"
              accessibilityLabel={t('works.editProject')}
              onPress={() =>
                router.push({ pathname: '/(tabs)/immo/travaux/chantier/editer', params: { id } })
              }
            />
          </View>
        }
      />
      <Card style={{ marginBottom: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption" color="textSecondary">
              {t('works.committed')}
            </Text>
            <Amount cents={totals.committedCents} variant="title2" />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" color="textSecondary">
              {t('works.budget')}
            </Text>
            <Amount cents={totals.budgetCents} variant="title2" color="textSecondary" />
          </View>
        </View>
        <View style={{ marginTop: theme.spacing[2] }}>
          <ProgressBar
            value={totals.budgetCents ? totals.committedCents / totals.budgetCents : 0}
            level={totals.level}
          />
        </View>
        <Text variant="caption" color={levelTone} style={{ marginTop: 6 }}>
          {t('works.variance')} {formatCents(totals.varianceCents, { signed: true })} (
          {formatPct(totals.variancePct)}) · {t('works.paid')}{' '}
          {formatCents(totals.paidCents, { compact: true })}
        </Text>
      </Card>
      <TabChips<Tab>
            options={[
              { value: 'lots', label: t('works.tabLots') },
              { value: 'quotes', label: t('works.tabQuotes') },
              { value: 'payments', label: t('works.tabPayments') },
              { value: 'planning', label: t('works.tabPlanning') },
              { value: 'summary', label: t('works.tabSummary') },
            ]}
            value={tab}
            onChange={setTab}
          />
      <View style={{ marginTop: theme.spacing[3] }}>
        {tab === 'lots' ? (
          <>
            <Button
              label={t('works.addLot')}
              icon="Plus"
              variant="secondary"
              style={{ marginBottom: theme.spacing[3] }}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/immo/travaux/lot/[id]',
                  params: { id: 'new', projectId: id },
                })
              }
            />
            {lots.length === 0 ? (
              <Card>
                <EmptyState
                  icon="LayoutList"
                  title={t('works.noLots')}
                  body={t('works.noLotsHint')}
                  compact
                />
              </Card>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>
                {lots.map((l) => (
                  <Card
                    key={l.lot.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/immo/travaux/lot/[id]',
                        params: { id: l.lot.id, projectId: id },
                      })
                    }
                    accessibilityLabel={l.lot.name}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                      <PressableScale
                        onPress={() => updateLot(l.lot.id, { done: !l.lot.done })}
                        haptic="selection"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: l.lot.done }}
                        hitSlop={8}
                      >
                        <Icon
                          name={l.lot.done ? 'CircleCheck' : 'Circle'}
                          color={l.lot.done ? theme.colors.positive : theme.colors.textMuted}
                          size={22}
                        />
                      </PressableScale>
                      <Text
                        variant="headline"
                        style={{ flex: 1, textDecorationLine: l.lot.done ? 'line-through' : 'none' }}
                      >
                        {l.lot.name}
                      </Text>
                      <Text
                        variant="callout"
                        tabular
                        color={
                          l.status.level === 'exceeded'
                            ? 'negative'
                            : l.status.level === 'warning'
                              ? 'warning'
                              : 'textSecondary'
                        }
                      >
                        {formatCents(l.acceptedCents, { compact: true })} /{' '}
                        {formatCents(l.lot.budgetCents, { compact: true })}
                      </Text>
                    </View>
                    <View style={{ marginTop: theme.spacing[2] }}>
                      <ProgressBar
                        value={l.lot.budgetCents ? l.acceptedCents / l.lot.budgetCents : 0}
                        level={l.status.level}
                        height={6}
                      />
                    </View>
                    <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
                      {t(`works.lotKinds.${l.lot.kind}`)} · TVA {l.lot.vatRateX10 / 10} % · {l.quotes.length}{' '}
                      {t('works.quotes').toLowerCase()} · {t('works.paid')}{' '}
                      {formatCents(l.paidCents, { compact: true })}
                      {l.schedule === 'delayed' ? ` · ${t('works.delayed')}` : ''}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        ) : null}

        {tab === 'quotes' ? (
          <>
            <Button
              label={t('works.addQuote')}
              icon="Plus"
              variant="secondary"
              style={{ marginBottom: theme.spacing[3] }}
              disabled={lots.length === 0}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/immo/travaux/devis/[id]',
                  params: { id: 'new', projectId: id, lotId: lots[0]?.lot.id ?? '' },
                })
              }
            />
            {lots.every((l) => l.quotes.length === 0) ? (
              <Card>
                <EmptyState
                  icon="FileText"
                  title={t('works.noQuotes')}
                  body={t('works.noQuotesHint')}
                  compact
                />
              </Card>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>
                {lots
                  .filter((l) => l.quotes.length > 0)
                  .map((l) => {
                    const cheapest = [...l.quotes].sort((a, b) => quoteInclVat(a) - quoteInclVat(b))[0];
                    return (
                      <Card key={l.lot.id} padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
                        <Text
                          variant="callout"
                          color="textSecondary"
                          style={{ paddingTop: theme.spacing[3] }}
                        >
                          {l.lot.name} · {t('works.budget')}{' '}
                          {formatCents(l.lot.budgetCents, { compact: true })}
                        </Text>
                        {l.quotes.map((q, i) => {
                          const ttc = quoteInclVat(q);
                          const diff = l.lot.budgetCents ? ttc - l.lot.budgetCents : 0;
                          return (
                            <ListRow
                              key={q.id}
                              icon={
                                q.status === 'accepted'
                                  ? 'CircleCheck'
                                  : q.status === 'rejected'
                                    ? 'CircleX'
                                    : 'FileText'
                              }
                              iconColor={
                                q.status === 'accepted'
                                  ? theme.colors.positive
                                  : q.status === 'rejected'
                                    ? theme.colors.textMuted
                                    : theme.colors.info
                              }
                              title={q.contractor}
                              subtitle={`${t(`works.statuses.${q.status}`)} · HT ${formatCents(q.amountExclVatCents, { compact: true })} · ${t('works.vsBudget')} ${formatCents(diff, { signed: true, compact: true })}${q.id === cheapest?.id && l.quotes.length > 1 ? ` · ${t('works.cheapest')}` : ''}`}
                              right={<Amount cents={ttc} variant="headline" />}
                              last={i === l.quotes.length - 1}
                              onPress={() =>
                                router.push({
                                  pathname: '/(tabs)/immo/travaux/devis/[id]',
                                  params: { id: q.id, projectId: id, lotId: l.lot.id },
                                })
                              }
                            />
                          );
                        })}
                      </Card>
                    );
                  })}
              </View>
            )}
          </>
        ) : null}

        {tab === 'payments' ? (
          <>
            <Button
              label={t('works.addPayment')}
              icon="Plus"
              variant="secondary"
              style={{ marginBottom: theme.spacing[3] }}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/immo/travaux/paiement/[id]',
                  params: { id: 'new', projectId: id },
                })
              }
            />
            {payments.length === 0 ? (
              <Card>
                <EmptyState
                  icon="CalendarDays"
                  title={t('works.noPayments')}
                  body={t('works.noPaymentsHint')}
                  compact
                />
              </Card>
            ) : (
              <Card padded={false} style={{ paddingHorizontal: theme.spacing[4] }}>
                {payments.map((p, i) => (
                  <ListRow
                    key={p.payment.id}
                    icon={
                      p.status === 'paid'
                        ? 'CircleCheck'
                        : p.status === 'late'
                          ? 'CircleExclamationPoint'
                          : 'Clock'
                    }
                    iconColor={statusColor[p.status]}
                    title={p.payment.label}
                    subtitle={`${statusLabel[p.status]} · ${formatDate(p.payment.paidAt ?? p.payment.dueDate)} · ${t(`works.paymentKinds.${p.payment.kind}`)}${p.payment.lotId ? ` · ${lots.find((l) => l.lot.id === p.payment.lotId)?.lot.name ?? ''}` : ''}`}
                    right={
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Amount cents={p.payment.amountCents} variant="headline" />
                        <PressableScale
                          onPress={() => {
                            updateWorkPayment(p.payment.id, {
                              paidAt: p.payment.paidAt ? null : toIsoDate(new Date()),
                            });
                            haptics.success();
                          }}
                          haptic="light"
                          accessibilityRole="button"
                          hitSlop={8}
                        >
                          <Text variant="caption" color="brand">
                            {p.payment.paidAt ? t('works.markUnpaid') : t('works.markPaid')}
                          </Text>
                        </PressableScale>
                      </View>
                    }
                    last={i === payments.length - 1}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/immo/travaux/paiement/[id]',
                        params: { id: p.payment.id, projectId: id },
                      })
                    }
                  />
                ))}
              </Card>
            )}
          </>
        ) : null}

        {tab === 'planning' ? (
          plan ? (
            <Card padded={false}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View
                  style={{ padding: theme.spacing[3], minWidth: Math.max(320, plan.weeks.length * 48 + 120) }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      marginLeft: 120,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      paddingBottom: 4,
                    }}
                  >
                    {plan.weeks.map((w) => (
                      <Text key={w.toISOString()} variant="micro" color="textMuted" style={{ width: 48 }}>
                        {t('works.week')} {formatDate(w, 'd/M')}
                      </Text>
                    ))}
                  </View>
                  {lots.map((l) => {
                    const span = lotSpan(l.lot, plan.start, plan.weeks.length);
                    const color =
                      l.schedule === 'delayed'
                        ? theme.colors.negative
                        : l.schedule === 'done'
                          ? theme.colors.positive
                          : (theme.chart[project.colorIndex % theme.chart.length] ?? theme.module.works);
                    const width = plan.weeks.length * 48;
                    return (
                      <View key={l.lot.id} style={{ flexDirection: 'row', alignItems: 'center', height: 36 }}>
                        <Text variant="caption" numberOfLines={1} style={{ width: 112, marginRight: 8 }}>
                          {l.lot.name}
                        </Text>
                        <View style={{ width, height: 14, position: 'relative' }}>
                          {span ? (
                            <View
                              style={{
                                position: 'absolute',
                                left: span.left * width,
                                width: span.width * width,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: color,
                              }}
                            />
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    {[
                      {
                        label: t('works.onTrack'),
                        color: theme.chart[project.colorIndex % theme.chart.length] ?? theme.module.works,
                      },
                      { label: t('works.delayed'), color: theme.colors.negative },
                      { label: t('works.done'), color: theme.colors.positive },
                    ].map((k) => (
                      <View key={k.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: k.color }} />
                        <Text variant="caption" color="textSecondary">
                          {k.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="CalendarDays"
                title={t('works.planning')}
                body={t('works.noPlanning')}
                compact
              />
            </Card>
          )
        ) : null}

        {tab === 'summary' ? (
          <>
            <Card style={{ marginBottom: theme.spacing[3] }}>
              <ResultRow label={t('works.budget')} value={formatCents(totals.budgetCents)} />
              <ResultRow label={t('works.committed')} value={formatCents(totals.committedCents)} strong />
              <ResultRow
                label={t('works.variance')}
                value={`${formatCents(totals.varianceCents, { signed: true })} (${formatPct(totals.variancePct)})`}
                tone={levelTone}
              />
              <ResultRow label={t('works.paid')} value={formatCents(totals.paidCents)} />
              <ResultRow
                label={t('works.remainingToPay')}
                value={formatCents(totals.remainingToPayCents)}
                strong
              />
              <ResultRow label={t('works.progress')} value={formatPct(totals.paidPct)} last />
            </Card>
            <Card
              padded={false}
              style={{ paddingHorizontal: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              {lots.map((l, i) => (
                <ListRow
                  key={l.lot.id}
                  title={l.lot.name}
                  subtitle={`${t('works.budget')} ${formatCents(l.lot.budgetCents, { compact: true })} · ${t('works.paid')} ${formatCents(l.paidCents, { compact: true })}`}
                  right={<Amount cents={l.acceptedCents} variant="callout" />}
                  last={i === lots.length - 1}
                />
              ))}
            </Card>
            <Button
              label={t('works.exportSummary')}
              icon="FileText"
              variant="secondary"
              onPress={() => void exportProjectPdf(view).catch(() => showToast(t('common.error')))}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
