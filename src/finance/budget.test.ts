import {
  budgetMonthRange,
  computeSettlement,
  envelopeStatus,
  monthKey,
  shareOf,
  splitWeights,
} from './budget';

const camille = { id: 'c', monthlyIncomeCents: 2_100_00 };
const hugo = { id: 'h', monthlyIncomeCents: 2_900_00 };

describe('budget — répartition', () => {
  test('50/50', () => {
    expect(shareOf(100_00, [camille, hugo], { mode: 'equal' })).toEqual([50_00, 50_00]);
    expect(shareOf(1, [camille, hugo], { mode: 'equal' })).toEqual([1, 0]);
  });

  test('prorata des revenus : 42 % / 58 %', () => {
    expect(splitWeights([camille, hugo], { mode: 'prorata' })).toEqual([2_100_00, 2_900_00]);
    expect(shareOf(1_000_00, [camille, hugo], { mode: 'prorata' })).toEqual([420_00, 580_00]);
  });

  test('prorata avec revenus nuls retombe sur 50/50', () => {
    expect(
      shareOf(
        100_00,
        [
          { id: 'a', monthlyIncomeCents: 0 },
          { id: 'b', monthlyIncomeCents: 0 },
        ],
        { mode: 'prorata' },
      ),
    ).toEqual([50_00, 50_00]);
  });

  test('pourcentage personnalisé 70/30, borné à 0–100', () => {
    expect(shareOf(100_00, [camille, hugo], { mode: 'custom', customPctPerson1: 70 })).toEqual([
      70_00, 30_00,
    ]);
    expect(shareOf(100_00, [camille, hugo], { mode: 'custom', customPctPerson1: 150 })).toEqual([100_00, 0]);
  });

  test('personne seule : tout pour elle', () => {
    expect(shareOf(100_00, [camille], { mode: 'prorata' })).toEqual([100_00]);
  });
});

describe('budget — règlement du mois', () => {
  test('Hugo a payé le loyer de 1 000 € en prorata : Camille lui doit 420 €', () => {
    const s = computeSettlement([camille, hugo], [{ amountCents: 1_000_00, paidById: 'h', shared: true }], {
      mode: 'prorata',
    });
    expect(s.totalSharedCents).toBe(1_000_00);
    expect(s.transfer).toEqual({ fromId: 'c', toId: 'h', amountCents: 420_00 });
    expect(s.perPerson.find((p) => p.id === 'c')!.balanceCents).toBe(-420_00);
  });

  test('dépenses personnelles ignorées, équilibre parfait → aucun transfert', () => {
    const s = computeSettlement(
      [camille, hugo],
      [
        { amountCents: 50_00, paidById: 'c', shared: true },
        { amountCents: 50_00, paidById: 'h', shared: true },
        { amountCents: 500_00, paidById: 'c', shared: false },
      ],
      { mode: 'equal' },
    );
    expect(s.totalSharedCents).toBe(100_00);
    expect(s.transfer).toBeNull();
  });

  test('un seul membre : jamais de transfert', () => {
    const s = computeSettlement([camille], [{ amountCents: 100_00, paidById: 'c', shared: true }], {
      mode: 'equal',
    });
    expect(s.transfer).toBeNull();
  });
});

describe('budget — enveloppes et mois budgétaire', () => {
  test('niveaux ok / warning / exceeded', () => {
    expect(envelopeStatus(100_00, 50_00).level).toBe('ok');
    expect(envelopeStatus(100_00, 80_00).level).toBe('warning');
    expect(envelopeStatus(100_00, 101_00).level).toBe('exceeded');
    expect(envelopeStatus(0, 50_00).level).toBe('ok');
    expect(envelopeStatus(100_00, 25_00).usedPct).toBe(25);
    expect(envelopeStatus(100_00, 25_00).remainingCents).toBe(75_00);
  });

  test('mois civil (jour 1)', () => {
    const r = budgetMonthRange(new Date(2026, 10, 15), 1);
    expect(r.key).toBe('2026-11');
    expect(r.start).toEqual(new Date(2026, 10, 1));
    expect(r.end).toEqual(new Date(2026, 11, 1));
  });

  test('mois commençant le 25 : le 27 novembre appartient à décembre', () => {
    const r = budgetMonthRange(new Date(2026, 10, 27), 25);
    expect(r.key).toBe('2026-12');
    expect(r.start).toEqual(new Date(2026, 10, 25));
    expect(r.end).toEqual(new Date(2026, 11, 25));
    const before = budgetMonthRange(new Date(2026, 10, 10), 25);
    expect(before.key).toBe('2026-11');
    expect(before.start).toEqual(new Date(2026, 9, 25));
  });

  test('monthKey', () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe('2026-01');
    expect(monthKey(new Date(2026, 11, 5))).toBe('2026-12');
  });
});
