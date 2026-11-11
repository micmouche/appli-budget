/**
 * Budget de couple : répartition des dépenses communes et règlement du mois.
 *
 * Trois modes :
 * - 'equal' : 50/50.
 * - 'prorata' : au prorata des revenus nets de chacun.
 * - 'custom' : pourcentage fixé pour la personne 1 (le reste pour la personne 2).
 */
import { type Cents, splitCents } from './money';

export type SplitMode = 'equal' | 'prorata' | 'custom';

export interface Person {
  id: string;
  monthlyIncomeCents: Cents;
}

export interface SharedExpense {
  amountCents: Cents;
  /** Qui a payé. */
  paidById: string;
  /** true = dépense commune à répartir ; false = dépense personnelle (ignorée dans le règlement). */
  shared: boolean;
}

export interface SplitSettings {
  mode: SplitMode;
  /** Part de la personne 1 en % (0–100), utilisée si mode = 'custom'. */
  customPctPerson1?: number;
}

/** Poids de répartition pour chaque personne (ordre de `persons`). */
export function splitWeights(persons: readonly Person[], settings: SplitSettings): number[] {
  if (persons.length === 1) return [1];
  switch (settings.mode) {
    case 'equal':
      return persons.map(() => 1);
    case 'prorata': {
      const total = persons.reduce((a, p) => a + p.monthlyIncomeCents, 0);
      if (total <= 0) return persons.map(() => 1);
      return persons.map((p) => p.monthlyIncomeCents);
    }
    case 'custom': {
      const p1 = Math.min(100, Math.max(0, settings.customPctPerson1 ?? 50));
      return [p1, 100 - p1];
    }
  }
}

/** Part théorique de chaque personne pour un montant commun. */
export function shareOf(amountCents: Cents, persons: readonly Person[], settings: SplitSettings): Cents[] {
  return splitCents(amountCents, splitWeights(persons, settings));
}

export interface Settlement {
  /** Total des dépenses communes du mois. */
  totalSharedCents: Cents;
  /** Par personne : ce qu'elle devait (part théorique) et ce qu'elle a payé. */
  perPerson: { id: string; owedShareCents: Cents; paidCents: Cents; balanceCents: Cents }[];
  /** Transfert à effectuer : from paie `amountCents` à to. null si équilibré. */
  transfer: { fromId: string; toId: string; amountCents: Cents } | null;
}

/**
 * Règlement du mois : qui doit combien à qui.
 * balance = payé − part due. Positif = a trop payé (créancier).
 */
export function computeSettlement(
  persons: readonly Person[],
  expenses: readonly SharedExpense[],
  settings: SplitSettings,
): Settlement {
  const shared = expenses.filter((e) => e.shared);
  const totalSharedCents = shared.reduce((a, e) => a + e.amountCents, 0);
  const shares = shareOf(totalSharedCents, persons, settings);
  const perPerson = persons.map((p, i) => {
    const paidCents = shared.filter((e) => e.paidById === p.id).reduce((a, e) => a + e.amountCents, 0);
    const owedShareCents = shares[i] ?? 0;
    return { id: p.id, owedShareCents, paidCents, balanceCents: paidCents - owedShareCents };
  });
  if (persons.length < 2) return { totalSharedCents, perPerson, transfer: null };
  const creditor = perPerson.reduce((a, b) => (b.balanceCents > a.balanceCents ? b : a));
  const debtor = perPerson.reduce((a, b) => (b.balanceCents < a.balanceCents ? b : a));
  if (creditor.balanceCents <= 0 || debtor.balanceCents >= 0) {
    return { totalSharedCents, perPerson, transfer: null };
  }
  const amountCents = Math.min(creditor.balanceCents, -debtor.balanceCents);
  return { totalSharedCents, perPerson, transfer: { fromId: debtor.id, toId: creditor.id, amountCents } };
}

export interface EnvelopeStatus {
  budgetCents: Cents;
  spentCents: Cents;
  remainingCents: Cents;
  /** 0–100+ */
  usedPct: number;
  level: 'ok' | 'warning' | 'exceeded';
}

/** État d'une enveloppe de catégorie. Alerte à 80 %, dépassement à 100 %. */
export function envelopeStatus(budgetCents: Cents, spentCents: Cents): EnvelopeStatus {
  const usedPct = budgetCents <= 0 ? 0 : Math.round((spentCents / budgetCents) * 1000) / 10;
  let level: EnvelopeStatus['level'] = 'ok';
  if (budgetCents > 0 && spentCents > budgetCents) level = 'exceeded';
  else if (budgetCents > 0 && usedPct >= 80) level = 'warning';
  return { budgetCents, spentCents, remainingCents: budgetCents - spentCents, usedPct, level };
}

/**
 * Mois budgétaire : si le mois commence le 25 (jour de paie), le 27 novembre
 * appartient au mois budgétaire « décembre ». Retourne [début, fin] (fin exclue).
 */
export function budgetMonthRange(date: Date, startDay = 1): { start: Date; end: Date; key: string } {
  const day = Math.min(28, Math.max(1, startDay));
  let year = date.getFullYear();
  let month = date.getMonth();
  if (day > 1 && date.getDate() >= day) {
    month += 1;
  }
  if (day === 1) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return { start, end, key: monthKey(start) };
  }
  const labelDate = new Date(year, month, 1);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month, day);
  return { start, end, key: monthKey(labelDate) };
}

/** Clé « AAAA-MM » d'une date. */
export function monthKey(date: Date): string {
  const m = date.getMonth() + 1;
  return `${date.getFullYear()}-${m < 10 ? '0' : ''}${m}`;
}
