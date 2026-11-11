/** Logique pure du module Travaux. */
import type { WorkLot, WorkPayment, WorkQuote } from '@/db/schema';
import type { Cents } from '@/finance/money';
import { inclVat, lotStatus, aggregateLots, type LotStatus, type WorksVatRate } from '@/finance/works';

export type WorkPaymentStatus = 'paid' | 'late' | 'due' | 'planned';

export function vatRateOf(x10: number): WorksVatRate {
  if (x10 === 200) return 20;
  if (x10 === 100) return 10;
  if (x10 === 55) return 5.5;
  return 0;
}

export function quoteInclVat(q: Pick<WorkQuote, 'amountExclVatCents' | 'vatRateX10'>): Cents {
  return inclVat(q.amountExclVatCents, vatRateOf(q.vatRateX10));
}

/** Statut d'un paiement : payé, en retard (date dépassée), à payer (dans les 7 jours), prévu. */
export function workPaymentStatus(
  p: Pick<WorkPayment, 'dueDate' | 'paidAt'>,
  today: string,
  soonDays = 7,
): WorkPaymentStatus {
  if (p.paidAt) return 'paid';
  if (p.dueDate < today) return 'late';
  const [y, m, d] = today.split('-').map(Number);
  const soon = new Date(y ?? 2000, (m ?? 1) - 1, (d ?? 1) + soonDays);
  const soonIso = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, '0')}-${String(soon.getDate()).padStart(2, '0')}`;
  return p.dueDate <= soonIso ? 'due' : 'planned';
}

export interface LotView {
  lot: WorkLot;
  quotes: WorkQuote[];
  acceptedCents: Cents;
  paidCents: Cents;
  status: LotStatus;
  schedule: 'none' | 'done' | 'delayed' | 'onTrack';
}

export function buildLotViews(
  lots: readonly WorkLot[],
  quotes: readonly WorkQuote[],
  payments: readonly WorkPayment[],
  today: string,
): LotView[] {
  return lots.map((lot) => {
    const own = quotes.filter((q) => q.lotId === lot.id);
    const acceptedCents = own.filter((q) => q.status === 'accepted').reduce((a, q) => a + quoteInclVat(q), 0);
    const paidCents = payments
      .filter((p) => p.lotId === lot.id && p.paidAt)
      .reduce((a, p) => a + p.amountCents, 0);
    const schedule: LotView['schedule'] = lot.done
      ? 'done'
      : !lot.endDate
        ? 'none'
        : lot.endDate < today
          ? 'delayed'
          : 'onTrack';
    return {
      lot,
      quotes: own,
      acceptedCents,
      paidCents,
      status: lotStatus({ budgetCents: lot.budgetCents, committedCents: acceptedCents, paidCents }),
      schedule,
    };
  });
}

export interface ProjectTotals extends LotStatus {
  /** Paiements payés non rattachés à un lot (inclus dans paidCents). */
  unassignedPaidCents: Cents;
}

export function projectTotals(
  projectBudgetCents: Cents,
  lotViews: readonly LotView[],
  payments: readonly WorkPayment[],
): ProjectTotals {
  const agg = aggregateLots(
    lotViews.map((v) => ({
      budgetCents: v.lot.budgetCents,
      committedCents: v.acceptedCents,
      paidCents: v.paidCents,
    })),
  );
  const unassignedPaidCents = payments
    .filter((p) => p.paidAt && !p.lotId)
    .reduce((a, p) => a + p.amountCents, 0);
  const paidCents = agg.paidCents + unassignedPaidCents;
  const budgetCents = projectBudgetCents > 0 ? projectBudgetCents : agg.budgetCents;
  const base = lotStatus({ budgetCents, committedCents: agg.committedCents, paidCents });
  return { ...base, unassignedPaidCents };
}

/** Semaines (lundi) couvrant l'ensemble des lots datés, pour le planning. */
export function planningWeeks(lots: readonly WorkLot[]): { start: Date; weeks: Date[] } | null {
  const dated = lots.filter((l) => l.startDate && l.endDate);
  if (dated.length === 0) return null;
  const min = dated.map((l) => l.startDate!).sort()[0]!;
  const max = dated
    .map((l) => l.endDate!)
    .sort()
    .at(-1)!;
  const start = mondayOf(min);
  const end = new Date(Number(max.slice(0, 4)), Number(max.slice(5, 7)) - 1, Number(max.slice(8, 10)));
  const weeks: Date[] = [];
  for (
    let d = new Date(start);
    d <= end && weeks.length < 60;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
  )
    weeks.push(new Date(d));
  return { start, weeks };
}

export function mondayOf(iso: string): Date {
  const d = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

/** Position [début, fin] d'un lot en fraction de la plage du planning (0–1). */
export function lotSpan(
  lot: WorkLot,
  start: Date,
  weeksCount: number,
): { left: number; width: number } | null {
  if (!lot.startDate || !lot.endDate || weeksCount === 0) return null;
  const total = weeksCount * 7;
  const toDays = (iso: string): number =>
    Math.round(
      (new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).getTime() -
        start.getTime()) /
        86_400_000,
    );
  const from = Math.max(0, toDays(lot.startDate));
  const to = Math.min(total, toDays(lot.endDate) + 1);
  return { left: from / total, width: Math.max(1 / total, (to - from) / total) };
}
