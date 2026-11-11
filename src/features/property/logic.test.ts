import { computeLoan } from '@/finance/loan';
import { computeScenario, yearlyAmortization } from './logic';

describe('property scenario', () => {
  const base = {
    priceCents: 250_000_00,
    condition: 'old' as const,
    increasedDepartment: false,
    downPaymentCents: 40_000_00,
    rateX100: 350,
    insuranceX100: 34,
    months: 240,
    applicationFeeCents: 1_000_00,
    guaranteeFeeCents: 2_500_00,
    monthlyNetIncomeCents: 5_000_00,
    monthlyExistingChargesCents: 0,
  };

  test('enchaîne notaire, projet, emprunt, endettement', () => {
    const r = computeScenario(base);
    expect(r.notary.totalCents).toBeGreaterThan(17_000_00);
    expect(r.projectTotalCents).toBe(250_000_00 + r.notary.totalCents + 3_500_00);
    expect(r.principalCents).toBe(r.projectTotalCents - 40_000_00);
    expect(r.loan).not.toBeNull();
    expect(r.totalMonthlyCents).toBe(r.loan!.monthlyPaymentCents + r.loan!.monthlyInsuranceCents);
    expect(r.debtRatioPct).toBeCloseTo((r.totalMonthlyCents / 5_000_00) * 100, 0);
    expect(r.debtLevel).toBe('ok');
    expect(r.remainingToLiveCents).toBe(5_000_00 - r.totalMonthlyCents);
  });

  test('niveaux d’endettement', () => {
    expect(computeScenario({ ...base, monthlyNetIncomeCents: 4_150_00 }).debtLevel).toBe('warning');
    expect(computeScenario({ ...base, monthlyNetIncomeCents: 3_600_00 }).debtLevel).toBe('exceeded');
    expect(computeScenario({ ...base, monthlyNetIncomeCents: 0 }).debtLevel).toBe('ok');
  });

  test('apport couvrant tout : pas d’emprunt', () => {
    const r = computeScenario({ ...base, downPaymentCents: 400_000_00 });
    expect(r.principalCents).toBe(0);
    expect(r.loan).toBeNull();
    expect(r.totalMonthlyCents).toBe(0);
  });

  test('yearlyAmortization regroupe 12 mois et conserve les totaux', () => {
    const loan = computeLoan({ principalCents: 120_000_00, annualRatePct: 3, months: 36 });
    const years = yearlyAmortization(loan.schedule);
    expect(years).toHaveLength(3);
    expect(years.reduce((a, y) => a + y.interestCents, 0)).toBe(loan.totalInterestCents);
    expect(years.reduce((a, y) => a + y.principalCents, 0)).toBe(120_000_00);
    expect(years[2]!.remainingCents).toBe(0);
  });
});
