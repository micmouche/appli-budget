import { addDaysIso, declarationSummary, dueDateFor, paymentStatus, periodsToGenerate } from './logic';

describe('rental logic', () => {
  const base = {
    periodKey: '2026-11',
    dueDate: '2026-11-05',
    rentCents: 650_00,
    chargesCents: 50_00,
    paidCents: 0,
  };

  test('paymentStatus', () => {
    expect(paymentStatus(base, '2026-11-03')).toBe('pending');
    expect(paymentStatus(base, '2026-11-10')).toBe('pending'); // dans le délai de grâce de 5 jours
    expect(paymentStatus(base, '2026-11-11')).toBe('late');
    expect(paymentStatus({ ...base, paidCents: 300_00 }, '2026-11-08')).toBe('partial');
    expect(paymentStatus({ ...base, paidCents: 300_00 }, '2026-11-20')).toBe('late');
    expect(paymentStatus({ ...base, paidCents: 700_00 }, '2026-12-20')).toBe('paid');
    expect(paymentStatus(base, '2026-11-06', 0)).toBe('late');
  });

  test('dueDateFor borne le jour au dernier jour du mois', () => {
    expect(dueDateFor('2026-02', 31)).toBe('2026-02-28');
    expect(dueDateFor('2026-11', 5)).toBe('2026-11-05');
    expect(addDaysIso('2026-11-28', 5)).toBe('2026-12-03');
  });

  test('periodsToGenerate', () => {
    expect(periodsToGenerate('2026-09-15', null, '2026-11-10')).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(periodsToGenerate('2020-01-01', null, '2026-11-10', 2)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(periodsToGenerate('2026-09-01', '2026-10-15', '2026-11-10')).toEqual(['2026-09', '2026-10']);
    expect(periodsToGenerate('2027-01-01', null, '2026-11-10')).toEqual([]);
  });

  test('declarationSummary', () => {
    const s = declarationSummary(
      2026,
      [
        { paidAt: '2026-01-06', paidCents: 700_00 },
        { paidAt: '2026-02-06', paidCents: 700_00 },
        { paidAt: '2025-12-30', paidCents: 700_00 },
        { paidAt: null, paidCents: 0 },
      ],
      [
        { date: '2026-10-01', nature: 'propertyTax', amountCents: 900_00 },
        { date: '2026-03-01', nature: 'repairs', amountCents: 250_00 },
        { date: '2025-10-01', nature: 'propertyTax', amountCents: 850_00 },
      ],
    );
    expect(s.rentsCollectedCents).toBe(1_400_00);
    expect(s.byNature.propertyTax).toBe(900_00);
    expect(s.deductibleTotalCents).toBe(1_150_00);
    expect(s.netResultCents).toBe(250_00);
  });
});
