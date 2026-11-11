/**
 * Intérêts composés avec versements périodiques.
 *
 * Hypothèses :
 * - Le taux annuel est converti en taux périodique selon la fréquence de capitalisation
 *   (mensuelle : r/12 ; annuelle : r).
 * - Les versements ont lieu à chaque période, en début (« annuity due ») ou en fin.
 * - Les montants sont arrondis au centime à chaque période (comme un relevé réel),
 *   ce qui peut faire diverger de quelques centimes d'une formule fermée.
 */
import { type Cents, roundCents } from './money';

export type Compounding = 'monthly' | 'yearly';

export interface CompoundInput {
  initialCents: Cents;
  /** Versement périodique (par mois si compounding = monthly, par an sinon). */
  contributionCents: Cents;
  contributionTiming?: 'start' | 'end';
  annualRatePct: number;
  years: number;
  compounding?: Compounding;
}

export interface CompoundYearRow {
  year: number;
  contributedCents: Cents; // cumul versé (initial + versements)
  interestCents: Cents; // cumul des intérêts
  totalCents: Cents;
}

export interface CompoundResult {
  finalCents: Cents;
  totalContributedCents: Cents;
  totalInterestCents: Cents;
  rows: CompoundYearRow[];
}

export function compoundProjection(input: CompoundInput): CompoundResult {
  if (input.years < 0 || !Number.isInteger(input.years)) {
    throw new RangeError('years doit être un entier positif');
  }
  const compounding = input.compounding ?? 'monthly';
  const periodsPerYear = compounding === 'monthly' ? 12 : 1;
  const periodRate = input.annualRatePct / 100 / periodsPerYear;
  const timing = input.contributionTiming ?? 'end';

  let balance = input.initialCents;
  let contributed = input.initialCents;
  let interestTotal = 0;
  const rows: CompoundYearRow[] = [];

  for (let year = 1; year <= input.years; year += 1) {
    for (let p = 0; p < periodsPerYear; p += 1) {
      if (timing === 'start') {
        balance += input.contributionCents;
        contributed += input.contributionCents;
      }
      const interest = roundCents(balance * periodRate);
      balance += interest;
      interestTotal += interest;
      if (timing === 'end') {
        balance += input.contributionCents;
        contributed += input.contributionCents;
      }
    }
    rows.push({ year, contributedCents: contributed, interestCents: interestTotal, totalCents: balance });
  }

  return {
    finalCents: balance,
    totalContributedCents: contributed,
    totalInterestCents: interestTotal,
    rows,
  };
}

/**
 * Versement mensuel nécessaire pour atteindre un objectif à une date donnée,
 * à taux constant (versement en fin de mois). Résolution par bissection pour rester
 * cohérent avec les arrondis de compoundProjection.
 */
export function monthlyContributionForGoal(
  targetCents: Cents,
  initialCents: Cents,
  annualRatePct: number,
  months: number,
): Cents {
  if (months <= 0) return Math.max(0, targetCents - initialCents);
  const projectWith = (c: Cents): Cents => {
    let balance = initialCents;
    const r = annualRatePct / 100 / 12;
    for (let m = 0; m < months; m += 1) {
      balance += roundCents(balance * r);
      balance += c;
    }
    return balance;
  };
  if (projectWith(0) >= targetCents) return 0;
  let lo = 0;
  let hi = targetCents; // borne haute large
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (projectWith(mid) >= targetCents) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Nombre de mois pour atteindre un objectif avec un versement mensuel donné
 * (null si inatteignable en 100 ans).
 */
export function monthsToReachGoal(
  targetCents: Cents,
  initialCents: Cents,
  monthlyContributionCents: Cents,
  annualRatePct: number,
): number | null {
  if (initialCents >= targetCents) return 0;
  const r = annualRatePct / 100 / 12;
  let balance = initialCents;
  for (let m = 1; m <= 1200; m += 1) {
    balance += roundCents(balance * r);
    balance += monthlyContributionCents;
    if (balance >= targetCents) return m;
  }
  return null;
}
