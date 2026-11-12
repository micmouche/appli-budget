/** Alertes de l'accueil (enveloppes, épargne, loyers, chantiers, règlement) calculées sur les données réelles. */
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useBudgetMonth, useCurrentMonthKey, personName } from '@/features/budget/hooks';
import { useSavings } from '@/features/savings/hooks';
import { useRentals } from '@/features/rental/hooks';
import { useWorks } from '@/features/works/hooks';
import { formatCents, formatDate, formatMonthKey } from '@/utils/format';

export interface HomeAlert {
  key: string;
  tone: 'warning' | 'negative' | 'info';
  title: string;
  onPress: () => void;
}

export function useHomeAlerts(): HomeAlert[] {
  const { t } = useTranslation();
  const router = useRouter();
  const monthKey = useCurrentMonthKey();
  const month = useBudgetMonth(monthKey);
  const savings = useSavings();
  const rentals = useRentals();
  const works = useWorks();
  return useMemo(() => {
    const list: HomeAlert[] = [];
    for (const c of month.categoryTotals) {
      if (!c.envelope) continue;
      if (c.envelope.level === 'exceeded') {
        list.push({
          key: `env-${c.category.id}`,
          tone: 'negative',
          title: t('alerts.envelopeExceeded', {
            category: c.label,
            amount: formatCents(-c.envelope.remainingCents),
          }),
          onPress: () => router.push('/(tabs)/budget'),
        });
      } else if (c.envelope.level === 'warning') {
        list.push({
          key: `env-${c.category.id}`,
          tone: 'warning',
          title: t('alerts.envelopeWarning', { category: c.label, pct: Math.round(c.envelope.usedPct) }),
          onPress: () => router.push('/(tabs)/budget'),
        });
      }
    }
    for (const a of savings.accounts) {
      if (a.ceiling && a.ceiling.level !== 'ok') {
        list.push({
          key: `ceil-${a.account.id}`,
          tone: 'warning',
          title: t('savings.alertCeiling', { account: a.account.name }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/epargne/compte/[id]', params: { id: a.account.id } }),
        });
      }
    }
    for (const g of savings.goals) {
      if (g.projection.reached && !g.goal.achievedAt) {
        list.push({
          key: `goal-${g.goal.id}`,
          tone: 'info',
          title: t('savings.alertGoalReached', { goal: g.goal.name }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/epargne/objectif/[id]', params: { id: g.goal.id } }),
        });
      }
    }
    for (const v of rentals.views) {
      for (const p of v.payments) {
        if (p.status === 'late') {
          list.push({
            key: `rent-${p.payment.id}`,
            tone: 'negative',
            title: t('rental.alertLate', {
              property: v.property.name,
              month: formatMonthKey(p.payment.periodKey),
            }),
            onPress: () =>
              router.push({ pathname: '/(tabs)/immo/locatif/loyer/[id]', params: { id: p.payment.id } }),
          });
        } else if (p.status === 'partial') {
          list.push({
            key: `rent-${p.payment.id}`,
            tone: 'warning',
            title: t('rental.alertPartial', {
              property: v.property.name,
              month: formatMonthKey(p.payment.periodKey),
            }),
            onPress: () =>
              router.push({ pathname: '/(tabs)/immo/locatif/loyer/[id]', params: { id: p.payment.id } }),
          });
        }
      }
    }
    for (const w of works) {
      if (w.totals.level === 'exceeded') {
        list.push({
          key: `work-${w.project.id}`,
          tone: 'negative',
          title: t('works.alertOverBudget', {
            project: w.project.name,
            amount: formatCents(w.totals.varianceCents, { compact: true }),
          }),
          onPress: () =>
            router.push({ pathname: '/(tabs)/immo/travaux/chantier/[id]', params: { id: w.project.id } }),
        });
      }
      for (const p of w.payments) {
        if (p.status === 'late') {
          list.push({
            key: `wpay-${p.payment.id}`,
            tone: 'negative',
            title: t('works.alertPaymentLate', { project: w.project.name, label: p.payment.label }),
            onPress: () =>
              router.push({
                pathname: '/(tabs)/immo/travaux/paiement/[id]',
                params: { id: p.payment.id, projectId: w.project.id },
              }),
          });
        } else if (p.status === 'due') {
          list.push({
            key: `wpay-${p.payment.id}`,
            tone: 'warning',
            title: t('works.alertPaymentDue', {
              project: w.project.name,
              label: p.payment.label,
              date: formatDate(p.payment.dueDate),
            }),
            onPress: () =>
              router.push({
                pathname: '/(tabs)/immo/travaux/paiement/[id]',
                params: { id: p.payment.id, projectId: w.project.id },
              }),
          });
        }
      }
    }
    const tr = month.settlement.transfer;
    if (tr && !month.settlementRecord && month.persons.length > 1) {
      list.push({
        key: 'settlement',
        tone: 'info',
        title: t('alerts.settlementDue', {
          from: personName(month.persons, tr.fromId, '?'),
          to: personName(month.persons, tr.toId, '?'),
          amount: formatCents(tr.amountCents),
        }),
        onPress: () => router.push('/(tabs)/budget/reglement'),
      });
    }
    return list;
  }, [month, savings, rentals, works, router, t]);
}
