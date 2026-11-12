/** Logique pure des comptes : soldes à partir des opérations. */
import type { Cents } from '@/finance/money';

export interface TxLike {
  kind: 'expense' | 'income' | 'transfer';
  amountCents: Cents;
  accountId: string | null;
  toAccountId: string | null;
  deletedAt?: string | null;
  date?: string;
}

export const SAVINGS_PREFIX = 'sav:';

/** Solde d'un compte = solde de départ + revenus − dépenses − transferts sortants + transferts entrants. */
export function accountBalance(accountId: string, initialCents: Cents, txs: readonly TxLike[], untilDate?: string): Cents {
  let balance = initialCents;
  for (const t of txs) {
    if (t.deletedAt) continue;
    if (untilDate && t.date && t.date > untilDate) continue;
    if (t.kind === 'expense' && t.accountId === accountId) balance -= t.amountCents;
    else if (t.kind === 'income' && t.accountId === accountId) balance += t.amountCents;
    else if (t.kind === 'transfer') {
      if (t.accountId === accountId) balance -= t.amountCents;
      if (t.toAccountId === accountId) balance += t.amountCents;
    }
  }
  return balance;
}

/** Transferts vers l'épargne (identifiants préfixés) : montant net sorti des comptes du quotidien. */
export function transfersToSavings(txs: readonly TxLike[]): Cents {
  return txs.filter((t) => !t.deletedAt && t.kind === 'transfer' && t.toAccountId?.startsWith(SAVINGS_PREFIX)).reduce((a, t) => a + t.amountCents, 0);
}

export function isSavingsTarget(id: string | null | undefined): boolean {
  return Boolean(id && id.startsWith(SAVINGS_PREFIX));
}

export function savingsIdFromTarget(id: string): string {
  return id.slice(SAVINGS_PREFIX.length);
}
