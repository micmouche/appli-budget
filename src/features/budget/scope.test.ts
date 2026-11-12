import {
  accountInScope,
  expenseInScope,
  incomeInScope,
  personScope,
  scopeResources,
  scopeTotals,
  type ScopeAccount,
  type ScopeTx,
} from './scope';

const accounts: ScopeAccount[] = [
  { id: 'joint', ownerId: null },
  { id: 'cam', ownerId: 'camille' },
  { id: 'hugo', ownerId: 'hugo' },
];
const tx = (p: Partial<ScopeTx>): ScopeTx => ({
  kind: 'expense',
  amountCents: 0,
  shared: false,
  paidById: null,
  accountId: null,
  toAccountId: null,
  ...p,
});

const txs: ScopeTx[] = [
  tx({ kind: 'income', amountCents: 2000_00, paidById: 'camille', accountId: 'cam' }),
  tx({ kind: 'income', amountCents: 3000_00, paidById: 'hugo', accountId: 'hugo' }),
  tx({ kind: 'transfer', amountCents: 1000_00, paidById: 'camille', accountId: 'cam', toAccountId: 'joint' }),
  tx({ kind: 'transfer', amountCents: 1500_00, paidById: 'hugo', accountId: 'hugo', toAccountId: 'joint' }),
  tx({
    kind: 'transfer',
    amountCents: 200_00,
    paidById: 'hugo',
    accountId: 'hugo',
    toAccountId: 'sav:livret',
  }),
  tx({ kind: 'expense', amountCents: 800_00, shared: true, paidById: 'camille', accountId: 'joint' }),
  tx({ kind: 'expense', amountCents: 120_00, shared: false, paidById: 'camille', accountId: 'cam' }),
  tx({ kind: 'expense', amountCents: 60_00, shared: false, paidById: 'hugo', accountId: 'hugo' }),
];

describe('périmètres', () => {
  it('classe les comptes', () => {
    expect(accountInScope(accounts[0]!, 'shared')).toBe(true);
    expect(accountInScope(accounts[1]!, 'shared')).toBe(false);
    expect(accountInScope(accounts[1]!, personScope('camille'))).toBe(true);
    expect(accountInScope(accounts[2]!, 'all')).toBe(true);
  });

  it('classe dépenses et revenus', () => {
    expect(expenseInScope({ shared: true, paidById: 'hugo' }, 'shared')).toBe(true);
    expect(expenseInScope({ shared: true, paidById: 'hugo' }, personScope('hugo'))).toBe(false);
    expect(expenseInScope({ shared: false, paidById: 'hugo' }, personScope('hugo'))).toBe(true);
    expect(incomeInScope({ paidById: 'hugo', accountId: 'joint' }, 'shared', accounts)).toBe(true);
    expect(incomeInScope({ paidById: 'hugo', accountId: 'hugo' }, personScope('hugo'), accounts)).toBe(true);
    expect(incomeInScope({ paidById: 'hugo', accountId: 'hugo' }, 'shared', accounts)).toBe(false);
  });

  it('totalise le commun avec les apports reçus', () => {
    const t = scopeTotals(txs, 'shared', accounts);
    expect(t.expensesCents).toBe(800_00);
    expect(t.incomeCents).toBe(0);
    expect(t.contributionsInCents).toBe(2500_00);
    expect(t.contributionsOutCents).toBe(0);
    expect(scopeResources(t)).toBe(2500_00);
  });

  it('totalise le perso avec les apports versés (épargne comprise)', () => {
    const t = scopeTotals(txs, personScope('hugo'), accounts);
    expect(t.incomeCents).toBe(3000_00);
    expect(t.expensesCents).toBe(60_00);
    expect(t.contributionsOutCents).toBe(1700_00);
    expect(scopeResources(t)).toBe(1300_00);
  });

  it('« tout » ignore les transferts internes', () => {
    const t = scopeTotals(txs, 'all', accounts);
    expect(t.incomeCents).toBe(5000_00);
    expect(t.expensesCents).toBe(980_00);
    expect(t.contributionsInCents).toBe(0);
    expect(t.contributionsOutCents).toBe(0);
  });
});
