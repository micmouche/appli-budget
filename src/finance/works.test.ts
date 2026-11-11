import { aggregateLots, exclVat, inclVat, lotStatus } from './works';

describe('works', () => {
  test('TVA 20 / 10 / 5,5 %', () => {
    expect(inclVat(1_000_00, 20)).toBe(1_200_00);
    expect(inclVat(1_000_00, 10)).toBe(1_100_00);
    expect(inclVat(1_000_00, 5.5)).toBe(1_055_00);
    expect(exclVat(1_200_00, 20)).toBe(1_000_00);
    expect(exclVat(1_055_00, 5.5)).toBe(1_000_00);
  });

  test('statut d’un lot', () => {
    const ok = lotStatus({ budgetCents: 10_000_00, committedCents: 8_000_00, paidCents: 4_000_00 });
    expect(ok.level).toBe('ok');
    expect(ok.varianceCents).toBe(-2_000_00);
    expect(ok.variancePct).toBe(-20);
    expect(ok.paidPct).toBe(50);
    expect(ok.remainingToPayCents).toBe(4_000_00);
    expect(lotStatus({ budgetCents: 10_000_00, committedCents: 9_500_00, paidCents: 0 }).level).toBe(
      'warning',
    );
    expect(lotStatus({ budgetCents: 10_000_00, committedCents: 10_500_00, paidCents: 0 }).level).toBe(
      'exceeded',
    );
  });

  test('agrégation chantier', () => {
    const total = aggregateLots([
      { budgetCents: 10_000_00, committedCents: 9_000_00, paidCents: 9_000_00 },
      { budgetCents: 5_000_00, committedCents: 7_000_00, paidCents: 1_000_00 },
    ]);
    expect(total.budgetCents).toBe(15_000_00);
    expect(total.committedCents).toBe(16_000_00);
    expect(total.level).toBe('exceeded');
    expect(total.remainingToPayCents).toBe(6_000_00);
  });
});
