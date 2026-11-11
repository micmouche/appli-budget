import {
  amortizationSchedule,
  borrowingCapacity,
  computeLoan,
  debtRatioPct,
  monthlyPayment,
  principalFromPayment,
} from './loan';

describe('loan — mensualité', () => {
  test('200 000 € à 3,5 % sur 20 ans → 1 159,92 € (valeur de référence des simulateurs)', () => {
    expect(monthlyPayment(200_000_00, 3.5, 240)).toBe(1159_92);
  });

  test('150 000 € à 4 % sur 25 ans → 791,76 €', () => {
    expect(monthlyPayment(150_000_00, 4, 300)).toBe(791_76);
  });

  test('taux zéro : capital / durée', () => {
    expect(monthlyPayment(100_000_00, 0, 120)).toBe(833_33);
  });

  test('durée invalide refusée', () => {
    expect(() => monthlyPayment(100_000_00, 3, 0)).toThrow(RangeError);
    expect(() => monthlyPayment(100_000_00, 3, 12.5)).toThrow(RangeError);
  });

  test('principalFromPayment est l’inverse de monthlyPayment (à l’arrondi près)', () => {
    const principal = principalFromPayment(1159_92, 3.5, 240);
    expect(Math.abs(principal - 200_000_00)).toBeLessThan(100); // < 1 €
  });
});

describe('loan — amortissement', () => {
  test('le capital restant termine à zéro et les intérêts totaux sont cohérents', () => {
    const rows = amortizationSchedule({ principalCents: 200_000_00, annualRatePct: 3.5, months: 240 });
    expect(rows).toHaveLength(240);
    expect(rows[239]!.remainingCents).toBe(0);
    const totalPrincipal = rows.reduce((a, r) => a + r.principalCents, 0);
    expect(totalPrincipal).toBe(200_000_00);
    const totalInterest = rows.reduce((a, r) => a + r.interestCents, 0);
    // 1 159,92 × 240 − 200 000 = 78 380,80 ; tolérance d'arrondi de quelques centimes
    expect(Math.abs(totalInterest - 78_380_80)).toBeLessThan(200);
    // Première échéance : intérêts = 200 000 × 3,5 % / 12 = 583,33
    expect(rows[0]!.interestCents).toBe(583_33);
    expect(rows[0]!.principalCents).toBe(1159_92 - 583_33);
  });

  test('assurance en % du capital initial', () => {
    const result = computeLoan({
      principalCents: 200_000_00,
      annualRatePct: 3.5,
      months: 240,
      insuranceAnnualPct: 0.34,
    });
    // 200 000 × 0,34 % / 12 = 56,67
    expect(result.monthlyInsuranceCents).toBe(56_67);
    expect(result.totalMonthlyCents).toBe(1159_92 + 56_67);
    expect(result.totalInsuranceCents).toBe(56_67 * 240);
  });

  test('TAEG approché supérieur au taux nominal quand il y a assurance et frais', () => {
    const noFees = computeLoan({ principalCents: 200_000_00, annualRatePct: 3.5, months: 240 });
    // Sans frais ni assurance, le TAEG actuariel vaut (1 + 3,5 %/12)^12 − 1 ≈ 3,56 %
    expect(noFees.taegPct).toBeGreaterThanOrEqual(3.55);
    expect(noFees.taegPct).toBeLessThanOrEqual(3.57);
    const withFees = computeLoan({
      principalCents: 200_000_00,
      annualRatePct: 3.5,
      months: 240,
      insuranceAnnualPct: 0.34,
      applicationFeeCents: 1_000_00,
      guaranteeFeeCents: 2_000_00,
    });
    expect(withFees.taegPct).toBeGreaterThan(noFees.taegPct);
    expect(withFees.taegPct).toBeLessThan(5);
    expect(withFees.totalCostCents).toBe(
      withFees.totalInterestCents + withFees.totalInsuranceCents + 3_000_00,
    );
  });
});

describe('loan — capacité d’emprunt (règle HCSF 35 %)', () => {
  test('4 000 € nets, sans charges, 3,5 % sur 20 ans, assurance 0,30 %', () => {
    const r = borrowingCapacity({
      monthlyNetIncomeCents: 4_000_00,
      monthlyExistingChargesCents: 0,
      annualRatePct: 3.5,
      months: 240,
      insuranceAnnualPct: 0.3,
    });
    expect(r.maxTotalMonthlyCents).toBe(1_400_00);
    // Valeur de référence calculée indépendamment : 231 420,37 €
    expect(Math.abs(r.maxPrincipalCents - 231_420_37)).toBeLessThan(5);
    // Mensualité crédit + assurance ≈ 1 400 €
    const insurance = Math.round((r.maxPrincipalCents * 0.003) / 12);
    expect(Math.abs(r.maxLoanMonthlyCents + insurance - 1_400_00)).toBeLessThan(5);
    expect(r.remainingToLiveCents).toBe(2_600_00);
  });

  test('les charges existantes réduisent la mensualité disponible, jamais en dessous de zéro', () => {
    const r = borrowingCapacity({
      monthlyNetIncomeCents: 3_000_00,
      monthlyExistingChargesCents: 1_200_00,
      annualRatePct: 3,
      months: 240,
    });
    expect(r.maxTotalMonthlyCents).toBe(0);
    expect(r.maxPrincipalCents).toBe(0);
    expect(r.currentDebtRatioPct).toBe(40);
  });

  test('apport et frais d’acquisition déterminent le prix max du bien', () => {
    const r = borrowingCapacity({
      monthlyNetIncomeCents: 5_000_00,
      monthlyExistingChargesCents: 0,
      annualRatePct: 0,
      months: 100,
      downPaymentCents: 30_000_00,
      acquisitionCostsPct: 8,
    });
    // 1 750 €/mois × 100 mois = 175 000 € ; budget 205 000 ; prix max = 205 000 / 1,08
    expect(r.maxPrincipalCents).toBe(175_000_00);
    expect(r.maxBudgetCents).toBe(205_000_00);
    expect(r.maxPropertyPriceCents).toBe(189_814_81);
  });

  test('debtRatioPct', () => {
    expect(debtRatioPct(4_000_00, 1_400_00)).toBe(35);
    expect(debtRatioPct(0, 100)).toBe(0);
  });
});
