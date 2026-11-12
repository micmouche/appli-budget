import { accountBalance, isSavingsTarget, savingsIdFromTarget, transfersToSavings } from './accounts';

const txs = [
  { kind: 'income' as const, amountCents: 2_100_00, accountId: 'a', toAccountId: null, date: '2026-11-01' },
  { kind: 'expense' as const, amountCents: 42_30, accountId: 'a', toAccountId: null, date: '2026-11-03' },
  { kind: 'transfer' as const, amountCents: 300_00, accountId: 'a', toAccountId: 'b', date: '2026-11-05' },
  { kind: 'transfer' as const, amountCents: 200_00, accountId: 'a', toAccountId: 'sav:x', date: '2026-11-06' },
  { kind: 'expense' as const, amountCents: 10_00, accountId: 'b', toAccountId: null, date: '2026-11-07', deletedAt: '2026-11-08' },
];

describe('accounts', () => {
  test('accountBalance', () => {
    expect(accountBalance('a', 500_00, txs)).toBe(500_00 + 2_100_00 - 42_30 - 300_00 - 200_00);
    expect(accountBalance('b', 0, txs)).toBe(300_00);
    expect(accountBalance('a', 500_00, txs, '2026-11-03')).toBe(500_00 + 2_100_00 - 42_30);
  });
  test('épargne', () => {
    expect(transfersToSavings(txs)).toBe(200_00);
    expect(isSavingsTarget('sav:x')).toBe(true);
    expect(isSavingsTarget('b')).toBe(false);
    expect(savingsIdFromTarget('sav:x')).toBe('x');
  });
});
