import { groupSubscriptions } from './subscriptions';

describe('abonnements', () => {
  it('regroupe par nature, insensible à la casse, « Autre » sans note', () => {
    const g = groupSubscriptions([
      { note: 'Netflix', amountCents: 1399 },
      { note: 'netflix', amountCents: 1399 },
      { note: 'Spotify', amountCents: 999 },
      { note: null, amountCents: 500 },
    ]);
    expect(g.map((x) => [x.label, x.totalCents, x.count])).toEqual([
      ['Netflix', 2798, 2],
      ['Spotify', 999, 1],
      ['Autre', 500, 1],
    ]);
  });
});
