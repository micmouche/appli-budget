/**
 * Gestion de travaux : TVA, écarts au budget, avancement des paiements.
 */
import { type Cents, roundCents } from './money';

export type WorksVatRate = 20 | 10 | 5.5 | 0;

/** Montant TTC à partir du HT et du taux de TVA. */
export function inclVat(exclVatCents: Cents, vatPct: WorksVatRate): Cents {
  return exclVatCents + roundCents(exclVatCents * (vatPct / 100));
}

/** Montant HT à partir du TTC. */
export function exclVat(inclVatCents: Cents, vatPct: WorksVatRate): Cents {
  return roundCents(inclVatCents / (1 + vatPct / 100));
}

export interface LotFigures {
  budgetCents: Cents;
  /** Devis retenu(s) TTC. */
  committedCents: Cents;
  paidCents: Cents;
}

export interface LotStatus extends LotFigures {
  varianceCents: Cents; // engagé − budget (positif = dépassement)
  variancePct: number;
  remainingToPayCents: Cents;
  paidPct: number;
  level: 'ok' | 'warning' | 'exceeded';
}

export function lotStatus(f: LotFigures): LotStatus {
  const varianceCents = f.committedCents - f.budgetCents;
  const variancePct = f.budgetCents <= 0 ? 0 : Math.round((varianceCents / f.budgetCents) * 1000) / 10;
  const paidPct = f.committedCents <= 0 ? 0 : Math.round((f.paidCents / f.committedCents) * 1000) / 10;
  let level: LotStatus['level'] = 'ok';
  if (f.budgetCents > 0 && varianceCents > 0) level = 'exceeded';
  else if (f.budgetCents > 0 && f.committedCents >= f.budgetCents * 0.9) level = 'warning';
  return {
    ...f,
    varianceCents,
    variancePct,
    remainingToPayCents: Math.max(0, f.committedCents - f.paidCents),
    paidPct,
    level,
  };
}

/** Agrège plusieurs lots en un total chantier. */
export function aggregateLots(lots: readonly LotFigures[]): LotStatus {
  return lotStatus({
    budgetCents: lots.reduce((a, l) => a + l.budgetCents, 0),
    committedCents: lots.reduce((a, l) => a + l.committedCents, 0),
    paidCents: lots.reduce((a, l) => a + l.paidCents, 0),
  });
}
