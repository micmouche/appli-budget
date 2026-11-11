import {
  averageMonthlyNet,
  balanceOf,
  ceilingStatus,
  defaultsForType,
  depositsOf,
  monthlySeries,
  projectGoal,
} from './logic';

const mv = [
  { accountId: 'a', type: 'deposit' as const, amountCents: 10_000_00, date: '2026-01-15' },
  { accountId: 'a', type: 'interest' as const, amountCents: 50_00, date: '2026-02-01' },
  { accountId: 'a', type: 'withdrawal' as const, amountCents: 2_000_00, date: '2026-03-10' },
  { accountId: 'b', type: 'deposit' as const, amountCents: 500_00, date: '2026-03-20' },
];

describe('savings logic', () => {
  test('balanceOf et depositsOf', () => {
    expect(balanceOf(mv, 'a')).toBe(8_050_00);
    expect(balanceOf(mv, 'a', '2026-02-28')).toBe(10_050_00);
    expect(balanceOf(mv, 'b')).toBe(500_00);
    expect(depositsOf(mv, 'a')).toBe(8_000_00);
  });

  test('ceilingStatus', () => {
    expect(ceilingStatus(null, 100)).toBeNull();
    expect(ceilingStatus(22_950_00, 10_000_00)!.level).toBe('ok');
    expect(ceilingStatus(22_950_00, 21_000_00)!.level).toBe('near');
    expect(ceilingStatus(22_950_00, 22_950_00)!.level).toBe('reached');
    expect(ceilingStatus(22_950_00, 22_950_00)!.remainingCents).toBe(0);
  });

  test('monthlySeries fin de mois', () => {
    const s = monthlySeries(mv, 3, new Date(2026, 2, 31));
    expect(s.map((x) => x.monthKey)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(s.map((x) => x.totalCents)).toEqual([10_000_00, 10_050_00, 8_550_00]);
  });

  test('projectGoal : versement conseillé et rythme', () => {
    const p = projectGoal({
      currentCents: 5_000_00,
      targetCents: 20_000_00,
      targetDate: '2027-03-01',
      averageMonthlyNetCents: 500_00,
      annualRatePct: 2,
      now: new Date(2026, 2, 15),
    });
    expect(p.monthsLeft).toBe(12);
    expect(p.suggestedMonthlyCents).toBeGreaterThan(1_200_00);
    expect(p.suggestedMonthlyCents).toBeLessThan(1_260_00);
    expect(p.monthsAtCurrentPace).toBeGreaterThan(25);
    expect(p.progressPct).toBe(25);
    const done = projectGoal({
      currentCents: 20_000_00,
      targetCents: 20_000_00,
      targetDate: null,
      averageMonthlyNetCents: 0,
      annualRatePct: 0,
    });
    expect(done.reached).toBe(true);
    expect(done.suggestedMonthlyCents).toBeNull();
    expect(done.monthsAtCurrentPace).toBe(0);
  });

  test('averageMonthlyNet sur 3 mois, intérêts exclus', () => {
    expect(averageMonthlyNet(mv, null, new Date(2026, 2, 31))).toBe(
      Math.round((10_000_00 - 2_000_00 + 500_00) / 3),
    );
    expect(averageMonthlyNet(mv, ['b'], new Date(2026, 2, 31))).toBe(Math.round(500_00 / 3));
  });

  test('defaultsForType', () => {
    expect(defaultsForType('livretA').ceilingCents).toBe(22_950_00);
    expect(defaultsForType('livretA').rateX100).toBe(170);
    expect(defaultsForType('crypto').rateX100).toBeNull();
  });
});
