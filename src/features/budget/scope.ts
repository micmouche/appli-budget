/**
 * Périmètres financiers : « Tout », « Commun » ou une personne.
 * Logique pure (testée) : quelles opérations et quels comptes appartiennent à un périmètre.
 */
import type { Cents } from '@/finance/money';

export type Scope = 'all' | 'shared' | `p:${string}`;

export function personScope(personId: string): Scope {
  return `p:${personId}`;
}

export function scopePersonId(scope: Scope): string | null {
  return scope.startsWith('p:') ? scope.slice(2) : null;
}

export interface ScopeAccount {
  id: string;
  ownerId: string | null;
}

export interface ScopeTx {
  kind: 'expense' | 'income' | 'transfer';
  amountCents: Cents;
  shared: boolean;
  paidById: string | null;
  accountId: string | null;
  toAccountId: string | null;
}

/** Un compte sans titulaire est commun ; sinon il appartient à son titulaire. */
export function accountInScope(account: ScopeAccount, scope: Scope): boolean {
  if (scope === 'all') return true;
  if (scope === 'shared') return account.ownerId === null;
  return account.ownerId === scopePersonId(scope);
}

/** Dépense : commune si marquée « commune », sinon personnelle à son payeur. */
export function expenseInScope(tx: Pick<ScopeTx, 'shared' | 'paidById'>, scope: Scope): boolean {
  if (scope === 'all') return true;
  if (scope === 'shared') return tx.shared;
  return !tx.shared && tx.paidById === scopePersonId(scope);
}

/** Revenu : commun s'il arrive sur un compte commun, sinon à la personne qui le perçoit. */
export function incomeInScope(
  tx: Pick<ScopeTx, 'paidById' | 'accountId'>,
  scope: Scope,
  accounts: readonly ScopeAccount[],
): boolean {
  if (scope === 'all') return true;
  const account = accounts.find((a) => a.id === tx.accountId);
  const onShared = account ? account.ownerId === null : false;
  if (scope === 'shared') return onShared;
  return !onShared && tx.paidById === scopePersonId(scope);
}

export interface ScopeTotals {
  /** Dépenses du périmètre. */
  expensesCents: Cents;
  /** Revenus encaissés dans le périmètre. */
  incomeCents: Cents;
  /** Apports reçus par transfert depuis un autre périmètre (ex. virement perso → compte joint). */
  contributionsInCents: Cents;
  /** Apports versés par transfert vers un autre périmètre. */
  contributionsOutCents: Cents;
}

/**
 * Totaux d'un périmètre. Les transferts ne comptent que lorsqu'ils franchissent la frontière
 * du périmètre (d'un compte hors périmètre vers un compte dedans, ou l'inverse).
 */
export function scopeTotals(
  txs: readonly ScopeTx[],
  scope: Scope,
  accounts: readonly ScopeAccount[],
): ScopeTotals {
  const totals: ScopeTotals = {
    expensesCents: 0,
    incomeCents: 0,
    contributionsInCents: 0,
    contributionsOutCents: 0,
  };
  const inScope = (id: string | null): boolean => {
    const a = accounts.find((x) => x.id === id);
    return a ? accountInScope(a, scope) : false;
  };
  for (const t of txs) {
    if (t.kind === 'expense') {
      if (expenseInScope(t, scope)) totals.expensesCents += t.amountCents;
    } else if (t.kind === 'income') {
      if (incomeInScope(t, scope, accounts)) totals.incomeCents += t.amountCents;
    } else if (scope !== 'all') {
      const from = inScope(t.accountId);
      const to = inScope(t.toAccountId);
      if (!from && to) totals.contributionsInCents += t.amountCents;
      if (from && !to) totals.contributionsOutCents += t.amountCents;
    }
  }
  return totals;
}

/** Ressources disponibles du périmètre = revenus + apports reçus − apports versés. */
export function scopeResources(t: ScopeTotals): Cents {
  return t.incomeCents + t.contributionsInCents - t.contributionsOutCents;
}
