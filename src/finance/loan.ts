/**
 * Crédit immobilier : mensualité, amortissement, capacité d'emprunt, coût total.
 *
 * Conventions :
 * - Montants en centimes entiers (`Cents`), taux en % annuel (ex. 3.5), durées en mois.
 * - Taux périodique mensuel = taux annuel / 12 (convention proportionnelle française).
 * - L'assurance emprunteur est calculée soit en % annuel du capital INITIAL
 *   (convention la plus répandue en France), soit comme mensualité fixe.
 */
import { type Cents, roundCents } from './money';
import { HCSF } from './constants.fr';

export interface LoanInput {
  /** Capital emprunté. */
  principalCents: Cents;
  /** Taux nominal annuel en %, ex. 3.5. */
  annualRatePct: number;
  /** Durée en mois. */
  months: number;
  /** Taux annuel d'assurance en % du capital initial (ex. 0.34). Optionnel. */
  insuranceAnnualPct?: number;
  /** Ou mensualité d'assurance fixe. Prioritaire sur insuranceAnnualPct si fourni. */
  insuranceMonthlyCents?: Cents;
  /** Frais de dossier (une fois). */
  applicationFeeCents?: Cents;
  /** Frais de garantie (hypothèque, caution) (une fois). */
  guaranteeFeeCents?: Cents;
}

export interface AmortizationRow {
  month: number;
  paymentCents: Cents;
  interestCents: Cents;
  principalCents: Cents;
  insuranceCents: Cents;
  remainingCents: Cents;
}

export interface LoanResult {
  /** Mensualité hors assurance. */
  monthlyPaymentCents: Cents;
  /** Mensualité d'assurance. */
  monthlyInsuranceCents: Cents;
  /** Mensualité totale (crédit + assurance). */
  totalMonthlyCents: Cents;
  totalInterestCents: Cents;
  totalInsuranceCents: Cents;
  totalFeesCents: Cents;
  /** Coût total du crédit = intérêts + assurance + frais. */
  totalCostCents: Cents;
  /** TAEG approché (taux actualisé prenant en compte assurance et frais), en %. */
  taegPct: number;
  schedule: AmortizationRow[];
}

function assertPositiveInt(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} doit être un entier strictement positif (reçu ${value})`);
  }
}

/**
 * Mensualité constante hors assurance (formule de l'annuité).
 * M = C × r / (1 − (1 + r)^−n) avec r = taux mensuel. Si r = 0 : M = C / n.
 */
export function monthlyPayment(principalCents: Cents, annualRatePct: number, months: number): Cents {
  assertPositiveInt('months', months);
  if (principalCents < 0) throw new RangeError('principalCents doit être positif');
  if (annualRatePct < 0) throw new RangeError('annualRatePct doit être positif');
  const r = annualRatePct / 100 / 12;
  if (r === 0) return roundCents(principalCents / months);
  const factor = Math.pow(1 + r, -months);
  return roundCents((principalCents * r) / (1 - factor));
}

/** Mensualité d'assurance selon la convention retenue. */
export function monthlyInsurance(input: LoanInput): Cents {
  if (input.insuranceMonthlyCents !== undefined) return roundCents(input.insuranceMonthlyCents);
  if (input.insuranceAnnualPct !== undefined && input.insuranceAnnualPct > 0) {
    return roundCents((input.principalCents * (input.insuranceAnnualPct / 100)) / 12);
  }
  return 0;
}

/**
 * Tableau d'amortissement complet. La dernière mensualité absorbe l'écart d'arrondi
 * pour que le capital restant dû termine exactement à zéro.
 */
export function amortizationSchedule(input: LoanInput): AmortizationRow[] {
  const payment = monthlyPayment(input.principalCents, input.annualRatePct, input.months);
  const insurance = monthlyInsurance(input);
  const r = input.annualRatePct / 100 / 12;
  const rows: AmortizationRow[] = [];
  let remaining = input.principalCents;
  for (let m = 1; m <= input.months; m += 1) {
    const interest = roundCents(remaining * r);
    let principal = payment - interest;
    let thisPayment = payment;
    if (m === input.months || principal > remaining) {
      // Dernière échéance : on solde exactement.
      principal = remaining;
      thisPayment = principal + interest;
    }
    remaining -= principal;
    rows.push({
      month: m,
      paymentCents: thisPayment,
      interestCents: interest,
      principalCents: principal,
      insuranceCents: insurance,
      remainingCents: remaining,
    });
    if (remaining === 0 && m < input.months) break;
  }
  return rows;
}

/**
 * TAEG approché : taux annuel actualisé tel que la somme actualisée des flux
 * (mensualités + assurance) égale le capital net reçu (capital − frais).
 * Résolution par bissection sur le taux mensuel, puis annualisation actuarielle
 * ((1 + i)^12 − 1), conformément à la définition réglementaire du TAEG.
 */
export function approximateTaeg(input: LoanInput, schedule: AmortizationRow[]): number {
  const fees = (input.applicationFeeCents ?? 0) + (input.guaranteeFeeCents ?? 0);
  const net = input.principalCents - fees;
  if (net <= 0 || schedule.length === 0) return 0;
  const flows = schedule.map((row) => row.paymentCents + row.insuranceCents);
  const npv = (i: number): number => {
    let total = 0;
    for (let k = 0; k < flows.length; k += 1) {
      total += flows[k]! / Math.pow(1 + i, k + 1);
    }
    return total - net;
  };
  let lo = 0;
  let hi = 1; // 100 % mensuel : borne haute absurde mais sûre
  for (let iter = 0; iter < 200; iter += 1) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  const monthly = (lo + hi) / 2;
  return Math.round((Math.pow(1 + monthly, 12) - 1) * 100 * 100) / 100;
}

/** Calcul complet d'un prêt. */
export function computeLoan(input: LoanInput): LoanResult {
  const schedule = amortizationSchedule(input);
  const monthlyPaymentCents = monthlyPayment(input.principalCents, input.annualRatePct, input.months);
  const monthlyInsuranceCents = monthlyInsurance(input);
  const totalInterestCents = schedule.reduce((a, r) => a + r.interestCents, 0);
  const totalInsuranceCents = schedule.reduce((a, r) => a + r.insuranceCents, 0);
  const totalFeesCents = (input.applicationFeeCents ?? 0) + (input.guaranteeFeeCents ?? 0);
  return {
    monthlyPaymentCents,
    monthlyInsuranceCents,
    totalMonthlyCents: monthlyPaymentCents + monthlyInsuranceCents,
    totalInterestCents,
    totalInsuranceCents,
    totalFeesCents,
    totalCostCents: totalInterestCents + totalInsuranceCents + totalFeesCents,
    taegPct: approximateTaeg(input, schedule),
    schedule,
  };
}

/**
 * Capital empruntable pour une mensualité donnée (inverse de la formule de l'annuité).
 * C = M × (1 − (1 + r)^−n) / r.
 */
export function principalFromPayment(monthlyCents: Cents, annualRatePct: number, months: number): Cents {
  assertPositiveInt('months', months);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return roundCents(monthlyCents * months);
  return roundCents((monthlyCents * (1 - Math.pow(1 + r, -months))) / r);
}

export interface CapacityInput {
  /** Revenus nets mensuels du foyer (salaires, pensions, 70 % des loyers perçus…). */
  monthlyNetIncomeCents: Cents;
  /** Charges de crédits en cours (mensualités) + loyer conservé après projet. */
  monthlyExistingChargesCents: Cents;
  /** Taux d'endettement maximal en % (35 par défaut, règle HCSF). */
  maxDebtRatioPct?: number;
  annualRatePct: number;
  months: number;
  /** Assurance en % annuel du capital initial (incluse dans le taux d'effort HCSF). */
  insuranceAnnualPct?: number;
  /** Apport personnel. */
  downPaymentCents?: Cents;
  /** Frais d'acquisition estimés en % du prix (notaire + garantie), pour déduire le prix max. */
  acquisitionCostsPct?: number;
}

export interface CapacityResult {
  /** Mensualité maximale (crédit + assurance) autorisée par le taux d'endettement. */
  maxTotalMonthlyCents: Cents;
  /** Part de cette mensualité disponible pour le crédit hors assurance. */
  maxLoanMonthlyCents: Cents;
  /** Capital empruntable. */
  maxPrincipalCents: Cents;
  /** Budget d'achat total (capital + apport). */
  maxBudgetCents: Cents;
  /** Prix du bien maximal une fois les frais d'acquisition déduits du budget. */
  maxPropertyPriceCents: Cents;
  /** Taux d'endettement actuel avant projet, en %. */
  currentDebtRatioPct: number;
  /** Reste à vivre mensuel après le projet. */
  remainingToLiveCents: Cents;
}

/**
 * Capacité d'emprunt selon la règle HCSF : (charges existantes + nouvelle mensualité
 * assurance comprise) / revenus nets ≤ 35 %.
 *
 * L'assurance étant proportionnelle au capital, on résout :
 * capital × [ r / (1 − (1+r)^−n) + a/12 ] = mensualité max, avec a = taux annuel d'assurance.
 */
export function borrowingCapacity(input: CapacityInput): CapacityResult {
  assertPositiveInt('months', input.months);
  const ratio = (input.maxDebtRatioPct ?? HCSF.maxDebtRatioPct) / 100;
  const maxTotalMonthly = Math.max(
    0,
    roundCents(input.monthlyNetIncomeCents * ratio - input.monthlyExistingChargesCents),
  );
  const r = input.annualRatePct / 100 / 12;
  const paymentPerEuro = r === 0 ? 1 / input.months : r / (1 - Math.pow(1 + r, -input.months));
  const insurancePerEuro = (input.insuranceAnnualPct ?? 0) / 100 / 12;
  const maxPrincipal = roundCents(maxTotalMonthly / (paymentPerEuro + insurancePerEuro));
  const maxLoanMonthly = roundCents(maxPrincipal * paymentPerEuro);
  const downPayment = input.downPaymentCents ?? 0;
  const maxBudget = maxPrincipal + downPayment;
  const costsPct = (input.acquisitionCostsPct ?? 0) / 100;
  const maxPropertyPrice = roundCents(maxBudget / (1 + costsPct));
  const currentDebtRatioPct =
    input.monthlyNetIncomeCents === 0
      ? 0
      : Math.round((input.monthlyExistingChargesCents / input.monthlyNetIncomeCents) * 1000) / 10;
  return {
    maxTotalMonthlyCents: maxTotalMonthly,
    maxLoanMonthlyCents: maxLoanMonthly,
    maxPrincipalCents: maxPrincipal,
    maxBudgetCents: maxBudget,
    maxPropertyPriceCents: maxPropertyPrice,
    currentDebtRatioPct,
    remainingToLiveCents: input.monthlyNetIncomeCents - input.monthlyExistingChargesCents - maxTotalMonthly,
  };
}

/** Taux d'endettement après projet, en % (1 décimale). */
export function debtRatioPct(monthlyNetIncomeCents: Cents, totalMonthlyChargesCents: Cents): number {
  if (monthlyNetIncomeCents <= 0) return 0;
  return Math.round((totalMonthlyChargesCents / monthlyNetIncomeCents) * 1000) / 10;
}
