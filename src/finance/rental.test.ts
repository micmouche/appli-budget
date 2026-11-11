import { irlRevision, maxDepositCents, rentalYield } from './rental';

describe('rental', () => {
  const base = {
    purchasePriceCents: 150_000_00,
    acquisitionCostsCents: 12_000_00,
    monthlyRentExclChargesCents: 650_00,
    annualNonRecoverableChargesCents: 1_800_00,
  };

  test('rentabilité brute et nette', () => {
    const r = rentalYield(base);
    expect(r.totalInvestmentCents).toBe(162_000_00);
    expect(r.annualRentCents).toBe(7_800_00);
    // 7 800 / 162 000 = 4,81 %
    expect(r.grossYieldPct).toBe(4.81);
    // (7 800 − 1 800) / 162 000 = 3,70 %
    expect(r.netYieldPct).toBe(3.7);
    expect(r.annualTaxCents).toBe(0);
    expect(r.netNetYieldPct).toBe(3.7);
  });

  test('cash-flow avec crédit', () => {
    const r = rentalYield({ ...base, monthlyLoanPaymentCents: 600_00 });
    // (7 800 − 1 800 − 7 200) / 12 = −100
    expect(r.annualCashflowCents).toBe(-1_200_00);
    expect(r.monthlyCashflowCents).toBe(-100_00);
  });

  test('impôt micro-foncier : abattement 30 %, TMI 30 % + PS 17,2 %', () => {
    const r = rentalYield({ ...base, marginalTaxRatePct: 30, taxRegime: 'micro' });
    // 7 800 × 70 % = 5 460 × 47,2 % = 2 577,12
    expect(r.annualTaxCents).toBe(2577_12);
    expect(r.netNetYieldPct).toBeLessThan(r.netYieldPct);
  });

  test('régime réel : charges et intérêts déductibles', () => {
    const r = rentalYield({
      ...base,
      marginalTaxRatePct: 30,
      taxRegime: 'reel',
      annualLoanInterestCents: 4_000_00,
    });
    // 7 800 − 1 800 − 4 000 = 2 000 × 47,2 % = 944
    expect(r.annualTaxCents).toBe(944_00);
  });

  test('vacance locative', () => {
    const r = rentalYield({ ...base, vacancyWeeksPerYear: 4 });
    expect(r.annualRentCents).toBe(Math.round(7_800_00 * (48 / 52)));
  });

  test('révision IRL', () => {
    expect(irlRevision(800_00, 142.06, 145.17)).toBe(817_51);
    expect(() => irlRevision(800_00, 0, 145)).toThrow(RangeError);
  });

  test('dépôt de garantie maximal', () => {
    expect(maxDepositCents(700_00, false)).toBe(700_00);
    expect(maxDepositCents(700_00, true)).toBe(1_400_00);
  });
});
