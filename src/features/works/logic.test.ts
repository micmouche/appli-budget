import {
  buildLotViews,
  lotSpan,
  mondayOf,
  planningWeeks,
  projectTotals,
  quoteInclVat,
  workPaymentStatus,
} from './logic';

const now = '2026-11-10T00:00:00.000Z';
const lot = (id: string, extra: Partial<Parameters<typeof buildLotViews>[0][number]> = {}) => ({
  id,
  projectId: 'p',
  name: id,
  kind: 'other' as const,
  budgetCents: 10_000_00,
  vatRateX10: 100,
  startDate: null,
  endDate: null,
  done: false,
  position: 0,
  createdAt: now,
  ...extra,
});

describe('works logic', () => {
  test('quoteInclVat selon le taux', () => {
    expect(quoteInclVat({ amountExclVatCents: 1_000_00, vatRateX10: 100 })).toBe(1_100_00);
    expect(quoteInclVat({ amountExclVatCents: 1_000_00, vatRateX10: 55 })).toBe(1_055_00);
    expect(quoteInclVat({ amountExclVatCents: 1_000_00, vatRateX10: 200 })).toBe(1_200_00);
  });

  test('workPaymentStatus', () => {
    expect(workPaymentStatus({ dueDate: '2026-11-20', paidAt: '2026-11-01' }, '2026-11-10')).toBe('paid');
    expect(workPaymentStatus({ dueDate: '2026-11-05', paidAt: null }, '2026-11-10')).toBe('late');
    expect(workPaymentStatus({ dueDate: '2026-11-15', paidAt: null }, '2026-11-10')).toBe('due');
    expect(workPaymentStatus({ dueDate: '2026-12-15', paidAt: null }, '2026-11-10')).toBe('planned');
  });

  test('buildLotViews : seul le devis retenu est engagé, paiements du lot payés', () => {
    const quotes = [
      {
        id: 'q1',
        projectId: 'p',
        lotId: 'a',
        contractor: 'X',
        amountExclVatCents: 8_000_00,
        vatRateX10: 100,
        status: 'accepted' as const,
        date: '2026-10-01',
        note: null,
        createdAt: now,
      },
      {
        id: 'q2',
        projectId: 'p',
        lotId: 'a',
        contractor: 'Y',
        amountExclVatCents: 9_500_00,
        vatRateX10: 100,
        status: 'received' as const,
        date: '2026-10-02',
        note: null,
        createdAt: now,
      },
    ];
    const payments = [
      {
        id: 'w1',
        projectId: 'p',
        lotId: 'a',
        label: 'Acompte',
        kind: 'deposit' as const,
        amountCents: 2_640_00,
        dueDate: '2026-10-05',
        paidAt: '2026-10-05',
        createdAt: now,
      },
      {
        id: 'w2',
        projectId: 'p',
        lotId: 'a',
        label: 'Solde',
        kind: 'balance' as const,
        amountCents: 6_160_00,
        dueDate: '2026-12-05',
        paidAt: null,
        createdAt: now,
      },
    ];
    const views = buildLotViews(
      [lot('a', { endDate: '2026-10-30', startDate: '2026-10-01' })],
      quotes,
      payments,
      '2026-11-10',
    );
    expect(views[0]!.acceptedCents).toBe(8_800_00);
    expect(views[0]!.paidCents).toBe(2_640_00);
    expect(views[0]!.status.level).toBe('ok');
    expect(views[0]!.status.remainingToPayCents).toBe(6_160_00);
    expect(views[0]!.schedule).toBe('delayed');
  });

  test('projectTotals : budget global prioritaire, paiements hors lot comptés', () => {
    const views = buildLotViews(
      [lot('a'), lot('b', { budgetCents: 5_000_00 })],
      [],
      [
        {
          id: 'w',
          projectId: 'p',
          lotId: null,
          label: 'Permis',
          kind: 'other' as const,
          amountCents: 300_00,
          dueDate: '2026-10-01',
          paidAt: '2026-10-01',
          createdAt: now,
        },
      ],
      '2026-11-10',
    );
    const t = projectTotals(0, views, [
      {
        id: 'w',
        projectId: 'p',
        lotId: null,
        label: 'Permis',
        kind: 'other',
        amountCents: 300_00,
        dueDate: '2026-10-01',
        paidAt: '2026-10-01',
        createdAt: now,
      },
    ]);
    expect(t.budgetCents).toBe(15_000_00);
    expect(t.paidCents).toBe(300_00);
    expect(t.unassignedPaidCents).toBe(300_00);
    expect(projectTotals(20_000_00, views, []).budgetCents).toBe(20_000_00);
  });

  test('planning : semaines et positions', () => {
    expect(mondayOf('2026-11-10').getDay()).toBe(1);
    const lots = [
      lot('a', { startDate: '2026-11-02', endDate: '2026-11-13' }),
      lot('b', { startDate: '2026-11-16', endDate: '2026-11-27' }),
    ];
    const plan = planningWeeks(lots)!;
    expect(plan.weeks).toHaveLength(4);
    const span = lotSpan(lots[0]!, plan.start, plan.weeks.length)!;
    expect(span.left).toBe(0);
    expect(span.width).toBeCloseTo(12 / 28, 5);
    expect(planningWeeks([lot('c')])).toBeNull();
  });
});
