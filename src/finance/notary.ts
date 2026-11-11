/**
 * Estimation des « frais de notaire » (frais d'acquisition) en France.
 *
 * Composition :
 * 1. Droits de mutation (DMTO) : ancien ≈ 5,81 % (ou 6,32 % avec part départementale à 5 %),
 *    neuf : 0,715 %.
 * 2. Émoluments du notaire : barème proportionnel dégressif + TVA 20 %.
 * 3. Contribution de sécurité immobilière : 0,10 %.
 * 4. Débours et formalités : forfait estimatif.
 *
 * Le résultat est une ESTIMATION : le décompte réel dépend du dossier
 * (mobilier déduit, remise d'émoluments possible au-delà de 100 000 €, etc.).
 */
import { type Cents, roundCents } from './money';
import {
  NOTARY_DISBURSEMENTS_CENTS,
  NOTARY_FEE_BRACKETS,
  SECURITY_CONTRIBUTION_PCT,
  TRANSFER_TAX_NEW_PCT,
  TRANSFER_TAX_OLD,
  VAT_PCT,
} from './constants.fr';

export type PropertyCondition = 'old' | 'new';

export interface NotaryInput {
  priceCents: Cents;
  condition: PropertyCondition;
  /** Département ayant voté la part à 5 % (loi de finances 2025). */
  increasedDepartmentRate?: boolean;
  /** Valeur du mobilier inclus dans le prix (déduit de l'assiette des droits). */
  furnitureCents?: Cents;
  /** Forfait débours personnalisé. */
  disbursementsCents?: Cents;
}

export interface NotaryResult {
  transferTaxCents: Cents;
  feesExclVatCents: Cents;
  feesVatCents: Cents;
  securityContributionCents: Cents;
  disbursementsCents: Cents;
  totalCents: Cents;
  /** Total en % du prix, 2 décimales. */
  totalPct: number;
}

/** Émoluments hors taxes selon le barème par tranches. */
export function notaryFeesExclVat(priceCents: Cents): Cents {
  let remaining = priceCents;
  let previousCap = 0;
  let total = 0;
  for (const bracket of NOTARY_FEE_BRACKETS) {
    const width = Math.min(remaining, bracket.upToCents - previousCap);
    if (width <= 0) break;
    total += width * (bracket.ratePct / 100);
    remaining -= width;
    previousCap = bracket.upToCents;
  }
  return roundCents(total);
}

/** Taux global des droits de mutation pour l'ancien, en % (ex. 5.80665). */
export function oldTransferTaxRatePct(increased = false): number {
  const dept = increased ? TRANSFER_TAX_OLD.departmentPctIncreased : TRANSFER_TAX_OLD.departmentPct;
  const stateLevy = dept * (TRANSFER_TAX_OLD.stateLevyPctOfDepartment / 100);
  return dept + TRANSFER_TAX_OLD.communePct + stateLevy;
}

export function estimateNotaryFees(input: NotaryInput): NotaryResult {
  if (input.priceCents < 0) throw new RangeError('priceCents doit être positif');
  const taxBase = Math.max(0, input.priceCents - (input.furnitureCents ?? 0));
  const taxRate =
    input.condition === 'new' ? TRANSFER_TAX_NEW_PCT : oldTransferTaxRatePct(input.increasedDepartmentRate);
  const transferTaxCents = roundCents(taxBase * (taxRate / 100));
  const feesExclVatCents = notaryFeesExclVat(input.priceCents);
  const feesVatCents = roundCents(feesExclVatCents * (VAT_PCT / 100));
  const securityContributionCents = roundCents(taxBase * (SECURITY_CONTRIBUTION_PCT / 100));
  const disbursementsCents = input.disbursementsCents ?? NOTARY_DISBURSEMENTS_CENTS;
  const totalCents =
    transferTaxCents + feesExclVatCents + feesVatCents + securityContributionCents + disbursementsCents;
  return {
    transferTaxCents,
    feesExclVatCents,
    feesVatCents,
    securityContributionCents,
    disbursementsCents,
    totalCents,
    totalPct: input.priceCents === 0 ? 0 : Math.round((totalCents / input.priceCents) * 10000) / 100,
  };
}
