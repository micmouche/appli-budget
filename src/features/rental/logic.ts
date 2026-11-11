/** Logique pure du module Locatif (statuts d'échéances, périodes, déclaration). */
import type { ChargeNature } from '@/db/schema';
import type { Cents } from '@/finance/money';

export type PaymentStatus = 'paid' | 'partial' | 'late' | 'pending';

export interface PaymentLike {
  periodKey: string;
  dueDate: string;
  rentCents: Cents;
  chargesCents: Cents;
  paidCents: Cents;
}

export function totalDue(p: Pick<PaymentLike, 'rentCents' | 'chargesCents'>): Cents {
  return p.rentCents + p.chargesCents;
}

/** Statut d'une échéance : encaissée, partielle, en retard (après délai de grâce) ou à venir. */
export function paymentStatus(p: PaymentLike, today: string, graceDays = 5): PaymentStatus {
  const due = totalDue(p);
  if (due <= 0 || p.paidCents >= due) return 'paid';
  const limit = addDaysIso(p.dueDate, graceDays);
  if (p.paidCents > 0) return today > limit ? 'late' : 'partial';
  return today > limit ? 'late' : 'pending';
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days);
  return toIso(date);
}

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Date d'exigibilité d'une période « AAAA-MM » au jour donné (borné au dernier jour du mois). */
export function dueDateFor(periodKey: string, dueDay: number): string {
  const [y, m] = periodKey.split('-').map(Number);
  const lastDay = new Date(y ?? 2000, m ?? 1, 0).getDate();
  return `${periodKey}-${String(Math.min(Math.max(1, dueDay), lastDay)).padStart(2, '0')}`;
}

/**
 * Périodes « AAAA-MM » à générer pour un bail : du mois d'entrée (ou d'il y a `backMonths` mois)
 * jusqu'au mois courant inclus, sans dépasser la date de sortie.
 */
export function periodsToGenerate(
  startDate: string,
  endDate: string | null,
  today: string,
  backMonths = 12,
): string[] {
  const [sy, sm] = startDate.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  let cursor = new Date(sy ?? 2000, (sm ?? 1) - 1, 1);
  const floor = new Date(ty ?? 2000, (tm ?? 1) - 1 - backMonths, 1);
  if (cursor < floor) cursor = floor;
  const end = endDate ? new Date(Number(endDate.slice(0, 4)), Number(endDate.slice(5, 7)) - 1, 1) : null;
  const last = new Date(ty ?? 2000, (tm ?? 1) - 1, 1);
  const result: string[] = [];
  while (cursor <= last && (!end || cursor <= end)) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return result;
}

export interface DeclarationSummary {
  year: number;
  rentsCollectedCents: Cents;
  byNature: Record<ChargeNature, Cents>;
  deductibleTotalCents: Cents;
  netResultCents: Cents;
}

/** Agrégats annuels pour la déclaration 2044 : loyers encaissés dans l'année, charges par nature. */
export function declarationSummary(
  year: number,
  payments: readonly { paidAt: string | null; paidCents: Cents }[],
  charges: readonly { date: string; nature: ChargeNature; amountCents: Cents }[],
): DeclarationSummary {
  const prefix = `${year}-`;
  const rentsCollectedCents = payments
    .filter((p) => p.paidAt?.startsWith(prefix))
    .reduce((a, p) => a + p.paidCents, 0);
  const byNature: Record<ChargeNature, Cents> = {
    propertyTax: 0,
    condo: 0,
    insurance: 0,
    management: 0,
    repairs: 0,
    interest: 0,
    other: 0,
  };
  for (const c of charges) {
    if (c.date.startsWith(prefix)) byNature[c.nature] += c.amountCents;
  }
  const deductibleTotalCents = Object.values(byNature).reduce((a, b) => a + b, 0);
  return {
    year,
    rentsCollectedCents,
    byNature,
    deductibleTotalCents,
    netResultCents: rentsCollectedCents - deductibleTotalCents,
  };
}
