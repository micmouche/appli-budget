/**
 * Investissement locatif : rentabilités, cash-flow, révision IRL.
 *
 * Définitions retenues (les plus courantes en France) :
 * - Rentabilité brute = loyers annuels hors charges / prix d'acquisition total × 100
 *   (prix + frais d'acquisition + travaux).
 * - Rentabilité nette = (loyers annuels − charges annuelles non récupérables) / prix total × 100.
 * - Rentabilité nette-nette = après impôt sur le revenu foncier et prélèvements sociaux,
 *   estimation simplifiée (micro-foncier avec abattement 30 %, ou réel avec intérêts déductibles).
 * - Cash-flow mensuel = loyer − charges mensuelles − mensualité de crédit − impôt mensuel estimé.
 */
import { type Cents, roundCents } from './money';
import { MICRO_FONCIER, SOCIAL_LEVIES_PCT } from './constants.fr';

export interface RentalInput {
  purchasePriceCents: Cents;
  acquisitionCostsCents: Cents; // notaire, agence, garantie
  initialWorksCents?: Cents;
  monthlyRentExclChargesCents: Cents;
  /** Charges annuelles non récupérables : taxe foncière, copropriété (part propriétaire), PNO, gestion, entretien. */
  annualNonRecoverableChargesCents: Cents;
  /** Mensualité de crédit (hors assurance ou avec, au choix de l'utilisateur). */
  monthlyLoanPaymentCents?: Cents;
  /** Intérêts d'emprunt annuels (déductibles au réel). */
  annualLoanInterestCents?: Cents;
  /** Taux marginal d'imposition en % pour l'estimation nette-nette. */
  marginalTaxRatePct?: number;
  taxRegime?: 'micro' | 'reel';
  /** Vacance locative en semaines par an (0 par défaut). */
  vacancyWeeksPerYear?: number;
}

export interface RentalResult {
  totalInvestmentCents: Cents;
  annualRentCents: Cents;
  grossYieldPct: number;
  netYieldPct: number;
  /** Impôt annuel estimé (IR + prélèvements sociaux) ; 0 si aucun TMI fourni. */
  annualTaxCents: Cents;
  netNetYieldPct: number;
  monthlyCashflowCents: Cents;
  annualCashflowCents: Cents;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

export function rentalYield(input: RentalInput): RentalResult {
  const totalInvestmentCents =
    input.purchasePriceCents + input.acquisitionCostsCents + (input.initialWorksCents ?? 0);
  const vacancyFactor = 1 - (input.vacancyWeeksPerYear ?? 0) / 52;
  const annualRentCents = roundCents(input.monthlyRentExclChargesCents * 12 * vacancyFactor);
  const netAnnual = annualRentCents - input.annualNonRecoverableChargesCents;

  let annualTaxCents = 0;
  if (input.marginalTaxRatePct !== undefined && input.marginalTaxRatePct > 0) {
    const regime = input.taxRegime ?? 'micro';
    let taxable: number;
    if (regime === 'micro') {
      taxable = annualRentCents * (1 - MICRO_FONCIER.abatementPct / 100);
    } else {
      taxable =
        annualRentCents - input.annualNonRecoverableChargesCents - (input.annualLoanInterestCents ?? 0);
    }
    taxable = Math.max(0, taxable);
    annualTaxCents = roundCents(taxable * ((input.marginalTaxRatePct + SOCIAL_LEVIES_PCT) / 100));
  }

  const annualLoan = (input.monthlyLoanPaymentCents ?? 0) * 12;
  const annualCashflowCents = netAnnual - annualLoan - annualTaxCents;

  return {
    totalInvestmentCents,
    annualRentCents,
    grossYieldPct: pct(annualRentCents, totalInvestmentCents),
    netYieldPct: pct(netAnnual, totalInvestmentCents),
    annualTaxCents,
    netNetYieldPct: pct(netAnnual - annualTaxCents, totalInvestmentCents),
    monthlyCashflowCents: roundCents(annualCashflowCents / 12),
    annualCashflowCents,
  };
}

/**
 * Révision annuelle du loyer selon l'indice de référence des loyers (IRL) :
 * nouveau loyer = loyer actuel × IRL nouveau / IRL ancien (même trimestre, année précédente).
 */
export function irlRevision(currentRentCents: Cents, oldIndex: number, newIndex: number): Cents {
  if (oldIndex <= 0 || newIndex <= 0) throw new RangeError('Les indices IRL doivent être positifs');
  return roundCents((currentRentCents * newIndex) / oldIndex);
}

/** Dépôt de garantie maximal légal : 1 mois de loyer hors charges (location nue), 2 mois (meublée). */
export function maxDepositCents(monthlyRentExclChargesCents: Cents, furnished: boolean): Cents {
  return monthlyRentExclChargesCents * (furnished ? 2 : 1);
}
