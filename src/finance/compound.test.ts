import { compoundProjection, monthlyContributionForGoal, monthsToReachGoal } from './compound';

describe('compound', () => {
  test('sans versement ni taux, le capital est inchangé', () => {
    const r = compoundProjection({
      initialCents: 1_000_00,
      contributionCents: 0,
      annualRatePct: 0,
      years: 5,
    });
    expect(r.finalCents).toBe(1_000_00);
    expect(r.totalInterestCents).toBe(0);
    expect(r.rows).toHaveLength(5);
  });

  test('capitalisation annuelle : 1 000 € à 10 % pendant 2 ans = 1 210 €', () => {
    const r = compoundProjection({
      initialCents: 1_000_00,
      contributionCents: 0,
      annualRatePct: 10,
      years: 2,
      compounding: 'yearly',
    });
    expect(r.finalCents).toBe(1_210_00);
    expect(r.rows[0]!.totalCents).toBe(1_100_00);
  });

  test('10 000 € + 100 €/mois à 3 % pendant 10 ans ≈ 27 467,68 € (référence sans arrondi intermédiaire)', () => {
    const r = compoundProjection({
      initialCents: 10_000_00,
      contributionCents: 100_00,
      annualRatePct: 3,
      years: 10,
    });
    expect(Math.abs(r.finalCents - 27_467_68)).toBeLessThan(100);
    expect(r.totalContributedCents).toBe(10_000_00 + 120 * 100_00);
    expect(r.finalCents).toBe(r.totalContributedCents + r.totalInterestCents);
  });

  test('versement en début de période rapporte plus qu’en fin', () => {
    const end = compoundProjection({
      initialCents: 0,
      contributionCents: 100_00,
      annualRatePct: 3,
      years: 3,
    });
    const start = compoundProjection({
      initialCents: 0,
      contributionCents: 100_00,
      annualRatePct: 3,
      years: 3,
      contributionTiming: 'start',
    });
    expect(start.finalCents).toBeGreaterThan(end.finalCents);
  });

  test('monthlyContributionForGoal atteint exactement l’objectif', () => {
    const c = monthlyContributionForGoal(20_000_00, 5_000_00, 2, 36);
    expect(c).toBeGreaterThan(0);
    const check = compoundProjection({
      initialCents: 5_000_00,
      contributionCents: c,
      annualRatePct: 2,
      years: 3,
    });
    expect(check.finalCents).toBeGreaterThanOrEqual(20_000_00);
    const checkMinus = compoundProjection({
      initialCents: 5_000_00,
      contributionCents: c - 1,
      annualRatePct: 2,
      years: 3,
    });
    expect(checkMinus.finalCents).toBeLessThan(20_000_00);
    expect(monthlyContributionForGoal(1_000_00, 2_000_00, 2, 12)).toBe(0);
  });

  test('monthsToReachGoal', () => {
    expect(monthsToReachGoal(1_000_00, 1_000_00, 0, 0)).toBe(0);
    expect(monthsToReachGoal(1_200_00, 0, 100_00, 0)).toBe(12);
    expect(monthsToReachGoal(1_000_00, 0, 0, 0)).toBeNull();
  });
});
