/** Hooks de lecture du module Budget (dérivés des dépôts + calculs finance). */
import { useMemo } from 'react';

import {
  computeSettlement,
  envelopeStatus,
  type EnvelopeStatus,
  type Person as FinancePerson,
} from '@/finance/budget';
import { useQuery } from '@/db/useQuery';
import {
  categoryLabel,
  currentMonthKey,
  getSettlementForMonth,
  listAccounts,
  listAllTransactions,
  listCategories,
  listExpensesForMonth,
  listPersons,
  listTransactionsForMonth,
  monthlyTotals,
} from '@/db/repositories';
import type { Account, Category, Expense, Person } from '@/db/schema';

import { accountBalance } from './accounts';
import { accountInScope, expenseInScope, scopePersonId, scopeResources, scopeTotals, type Scope } from './scope';
import { useSettings } from '@/store/settings';

export interface CategoryTotal {
  category: Category;
  label: string;
  totalCents: number;
  count: number;
  envelope: EnvelopeStatus | null;
}

export function useCurrentMonthKey(): string {
  const monthStartDay = useSettings((s) => s.monthStartDay);
  return useMemo(() => currentMonthKey(monthStartDay), [monthStartDay]);
}

export function useBudgetMonth(monthKey: string, scopeOverride?: Scope) {
  const monthStartDay = useSettings((s) => s.monthStartDay);
  const settingsScope = useSettings((s) => s.scope);
  const couple = useSettings((s) => s.couple);
  const scope: Scope = couple ? (scopeOverride ?? settingsScope) : 'all';
  const accountRows = useQuery(() => listAccounts(), []);
  const splitMode = useSettings((s) => s.splitMode);
  const customPctPerson1 = useSettings((s) => s.customPctPerson1);

  const allExpenses = useQuery(() => listExpensesForMonth(monthKey, monthStartDay), [monthKey, monthStartDay]);
  const categories = useQuery(() => listCategories(), []);
  const persons = useQuery(() => listPersons(), []);
  const settlementRecord = useQuery(() => getSettlementForMonth(monthKey), [monthKey]);
  const transactions = useQuery(
    () => listTransactionsForMonth(monthKey, monthStartDay),
    [monthKey, monthStartDay],
  );

  return useMemo(() => {
    const expenses = allExpenses.filter((e) => expenseInScope(e, scope));
    const totalCents = expenses.reduce((a, e) => a + e.amountCents, 0);
    const totals = scopeTotals(transactions, scope, accountRows);
    const anyRecorded = transactions.some((t) => t.kind === 'income' || t.kind === 'transfer');
    const scopePerson = scopePersonId(scope);
    /** Revenus déclarés : foyer entier, une personne, ou rien pour le commun. */
    const expectedIncomeCents =
      scope === 'shared'
        ? 0
        : persons.filter((p) => !scopePerson || p.id === scopePerson).reduce((a, p) => a + p.monthlyIncomeCents, 0);
    /** Ressources du mois : encaissées + apports s'il y a des opérations, sinon revenus déclarés. */
    const incomeCents = anyRecorded ? scopeResources(totals) : expectedIncomeCents;
    const byCategory = new Map<string, { totalCents: number; count: number }>();
    for (const e of expenses) {
      const cur = byCategory.get(e.categoryId) ?? { totalCents: 0, count: 0 };
      cur.totalCents += e.amountCents;
      cur.count += 1;
      byCategory.set(e.categoryId, cur);
    }
    const categoryTotals: CategoryTotal[] = categories
      .map((category) => {
        const agg = byCategory.get(category.id) ?? { totalCents: 0, count: 0 };
        return {
          category,
          label: categoryLabel(category),
          totalCents: agg.totalCents,
          count: agg.count,
          envelope: category.budgetCents ? envelopeStatus(category.budgetCents, agg.totalCents) : null,
        };
      })
      .sort((a, b) => b.totalCents - a.totalCents);
    const financePersons: FinancePerson[] = persons.map((p) => ({
      id: p.id,
      monthlyIncomeCents: p.monthlyIncomeCents,
    }));
    const settlement = computeSettlement(
      financePersons,
      allExpenses.map((e) => ({ amountCents: e.amountCents, paidById: e.paidById ?? '', shared: e.shared })),
      { mode: splitMode, customPctPerson1 },
    );
    return {
      scope,
      expenses,
      allExpenses,
      transactions,
      scopeTotals: totals,
      categories,
      persons,
      totalCents,
      incomeCents,
      balanceCents: incomeCents - totalCents,
      categoryTotals,
      settlement,
      settlementRecord,
    };
  }, [allExpenses, transactions, accountRows, scope, categories, persons, splitMode, customPctPerson1, settlementRecord]);
}

export function useMonthlyTotals(lastMonthKey: string, months: number) {
  const monthStartDay = useSettings((s) => s.monthStartDay);
  return useQuery(
    () => monthlyTotals(lastMonthKey, months, monthStartDay),
    [lastMonthKey, months, monthStartDay],
  );
}

export function useCategories(): Category[] {
  return useQuery(() => listCategories(), []);
}

export function usePersons(): Person[] {
  return useQuery(() => listPersons(), []);
}

export function personName(
  persons: readonly Person[],
  id: string | null | undefined,
  fallback: string,
): string {
  return persons.find((p) => p.id === id)?.name ?? fallback;
}

export type { Expense };

export interface AccountView {
  account: Account;
  balanceCents: number;
}

/** Comptes du quotidien avec leur solde courant. */
export function useAccounts(scope: Scope = 'all'): {
  accounts: AccountView[];
  totalCents: number;
  defaultAccount: Account | undefined;
} {
  const rows = useQuery(() => listAccounts(), []);
  const txs = useQuery(() => listAllTransactions(), []);
  return useMemo(() => {
    const accounts = rows
      .filter((a) => accountInScope(a, scope))
      .map((account) => ({
      account,
      balanceCents: accountBalance(account.id, account.initialBalanceCents, txs),
    }));
    return {
      accounts,
      totalCents: accounts.reduce((a, v) => a + v.balanceCents, 0),
      defaultAccount: rows.find((a) => a.isDefault) ?? rows[0],
    };
  }, [rows, txs, scope]);
}

/** Périmètre courant (toujours « tout » hors mode couple). */
export function useScope(): Scope {
  const couple = useSettings((s) => s.couple);
  const scope = useSettings((s) => s.scope);
  return couple ? scope : 'all';
}
