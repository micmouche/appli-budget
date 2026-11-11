/** Calcul complet d'un scénario d'achat immobilier (pur, testé). */
import { computeLoan, debtRatioPct, type LoanResult } from '@/finance/loan';
import { estimateNotaryFees, type NotaryResult } from '@/finance/notary';
import { HCSF } from '@/finance/constants.fr';
import type { Cents } from '@/finance/money';

export interface ScenarioInput {
  priceCents: Cents;
  condition: 'old' | 'new';
  increasedDepartment: boolean;
  downPaymentCents: Cents;
  rateX100: number;
  insuranceX100: number;
  months: number;
  applicationFeeCents: Cents;
  guaranteeFeeCents: Cents;
  monthlyNetIncomeCents: Cents;
  monthlyExistingChargesCents: Cents;
}

export interface ScenarioResult {
  notary: NotaryResult;
  /** Prix + notaire + frais de dossier et de garantie. */
  projectTotalCents: Cents;
  /** Capital à emprunter = projet − apport (0 si l'apport couvre tout). */
  principalCents: Cents;
  loan: LoanResult | null;
  totalMonthlyCents: Cents;
  debtRatioPct: number;
  debtLevel: 'ok' | 'warning' | 'exceeded';
  remainingToLiveCents: Cents;
}

export function computeScenario(input: ScenarioInput): ScenarioResult {
  const notary = estimateNotaryFees({
    priceCents: input.priceCents,
    condition: input.condition,
    increasedDepartmentRate: input.increasedDepartment,
  });
  const projectTotalCents =
    input.priceCents + notary.totalCents + input.applicationFeeCents + input.guaranteeFeeCents;
  const principalCents = Math.max(0, projectTotalCents - input.downPaymentCents);
  const loan =
    principalCents > 0 && input.months > 0
      ? computeLoan({
          principalCents,
          annualRatePct: input.rateX100 / 100,
          months: input.months,
          insuranceAnnualPct: input.insuranceX100 / 100,
          applicationFeeCents: input.applicationFeeCents,
          guaranteeFeeCents: input.guaranteeFeeCents,
        })
      : null;
  const totalMonthlyCents = loan?.totalMonthlyCents ?? 0;
  const ratio = debtRatioPct(
    input.monthlyNetIncomeCents,
    input.monthlyExistingChargesCents + totalMonthlyCents,
  );
  const debtLevel: ScenarioResult['debtLevel'] =
    input.monthlyNetIncomeCents <= 0
      ? 'ok'
      : ratio > HCSF.maxDebtRatioPct
        ? 'exceeded'
        : ratio > HCSF.maxDebtRatioPct - 3
          ? 'warning'
          : 'ok';
  return {
    notary,
    projectTotalCents,
    principalCents,
    loan,
    totalMonthlyCents,
    debtRatioPct: ratio,
    debtLevel,
    remainingToLiveCents: input.monthlyNetIncomeCents - input.monthlyExistingChargesCents - totalMonthlyCents,
  };
}

/** Agrégation annuelle d'un tableau d'amortissement. */
export function yearlyAmortization(rows: LoanResult['schedule']): {
  year: number;
  interestCents: Cents;
  principalCents: Cents;
  insuranceCents: Cents;
  remainingCents: Cents;
}[] {
  const years = new Map<
    number,
    {
      year: number;
      interestCents: Cents;
      principalCents: Cents;
      insuranceCents: Cents;
      remainingCents: Cents;
    }
  >();
  for (const r of rows) {
    const year = Math.ceil(r.month / 12);
    const cur = years.get(year) ?? {
      year,
      interestCents: 0,
      principalCents: 0,
      insuranceCents: 0,
      remainingCents: 0,
    };
    cur.interestCents += r.interestCents;
    cur.principalCents += r.principalCents;
    cur.insuranceCents += r.insuranceCents;
    cur.remainingCents = r.remainingCents;
    years.set(year, cur);
  }
  return [...years.values()];
}
