/** Dépenses : CRUD, agrégats mensuels, récurrences. */
import { and, desc, eq, gte, isNull, lt, or, sql } from 'drizzle-orm';
import { addMonths, addWeeks, addYears } from 'date-fns';

import { budgetMonthRange, type SplitMode } from '@/finance/budget';
import { newId } from '@/utils/id';
import { fromIsoDate, toIsoDate } from '@/utils/format';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { expenses, recurringExpenses, type Expense, type Frequency, type RecurringExpense, type TransactionKind } from '../schema';
import { defaultAccount } from './accounts';

export interface ExpenseInput {
  amountCents: number;
  categoryId: string;
  date: string; // AAAA-MM-JJ
  paidById: string | null;
  shared: boolean;
  note?: string | null;
  importKey?: string | null;
  kind?: TransactionKind;
  accountId?: string | null;
  toAccountId?: string | null;
  incomeSource?: string | null;
}

export function createExpense(input: ExpenseInput, db: Db = getDb()): Expense {
  const row: Expense = {
    id: newId('e_'),
    amountCents: Math.round(input.amountCents),
    categoryId: input.categoryId,
    date: input.date,
    paidById: input.paidById,
    shared: input.shared,
    note: input.note?.trim() || null,
    recurringId: null,
    importKey: input.importKey ?? null,
    kind: input.kind ?? 'expense',
    accountId: input.accountId ?? defaultAccount(db)?.id ?? null,
    toAccountId: input.toAccountId ?? null,
    incomeSource: input.incomeSource ?? null,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
  db.insert(expenses).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateExpense(id: string, patch: Partial<ExpenseInput>, db: Db = getDb()): void {
  db.update(expenses)
    .set({ ...patch, note: patch.note === undefined ? undefined : patch.note?.trim() || null, updatedAt: new Date().toISOString() })
    .where(eq(expenses.id, id))
    .run();
  bumpDataVersion();
}

export function deleteExpense(id: string, db: Db = getDb()): Expense | undefined {
  const row = db.select().from(expenses).where(eq(expenses.id, id)).get();
  db.update(expenses).set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(expenses.id, id)).run();
  bumpDataVersion();
  return row;
}

/** Annule une suppression (bouton « Annuler » du toast). */
export function restoreExpense(row: Expense, db: Db = getDb()): void {
  db.update(expenses).set({ deletedAt: null, updatedAt: new Date().toISOString() }).where(eq(expenses.id, row.id)).run();
  bumpDataVersion();
}

export function getExpense(id: string, db: Db = getDb()): Expense | undefined {
  return db.select().from(expenses).where(eq(expenses.id, id)).get();
}

/** Dépenses d'un mois budgétaire (clé AAAA-MM), les plus récentes d'abord. */
export function listExpensesForMonth(monthKey: string, monthStartDay: number, db: Db = getDb()): Expense[] {
  const { start, end } = rangeForMonthKey(monthKey, monthStartDay);
  return db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, toIsoDate(start)), lt(expenses.date, toIsoDate(end)), eq(expenses.kind, 'expense'), isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .all();
}

/** Toutes les opérations (dépenses, revenus, transferts) d'un mois budgétaire. */
export function listTransactionsForMonth(monthKey: string, monthStartDay: number, db: Db = getDb()): Expense[] {
  const { start, end } = rangeForMonthKey(monthKey, monthStartDay);
  return db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, toIsoDate(start)), lt(expenses.date, toIsoDate(end)), isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .all();
}

/** Opérations d'un compte (débit ou crédit), les plus récentes d'abord. */
export function listTransactionsForAccount(accountId: string, limit = 200, db: Db = getDb()): Expense[] {
  return db
    .select()
    .from(expenses)
    .where(and(or(eq(expenses.accountId, accountId), eq(expenses.toAccountId, accountId)), isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.date), desc(expenses.createdAt))
    .limit(limit)
    .all();
}

/** Toutes les opérations vivantes (calcul des soldes). */
export function listAllTransactions(db: Db = getDb()): Expense[] {
  return db.select().from(expenses).where(isNull(expenses.deletedAt)).all();
}

/** Bornes du mois budgétaire identifié par sa clé. */
export function rangeForMonthKey(monthKey: string, monthStartDay: number): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  const labelDate = new Date(y ?? 2000, (m ?? 1) - 1, 1);
  if (monthStartDay <= 1) {
    return { start: labelDate, end: addMonths(labelDate, 1) };
  }
  // Le mois « M » commence le jour J du mois M−1.
  const start = new Date(labelDate.getFullYear(), labelDate.getMonth() - 1, monthStartDay);
  const end = new Date(labelDate.getFullYear(), labelDate.getMonth(), monthStartDay);
  return { start, end };
}

export function currentMonthKey(monthStartDay: number, now = new Date()): string {
  return budgetMonthRange(now, monthStartDay).key;
}

/** Clé du mois précédent / suivant. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = addMonths(new Date(y ?? 2000, (m ?? 1) - 1, 1), delta);
  const mm = d.getMonth() + 1;
  return `${d.getFullYear()}-${mm < 10 ? '0' : ''}${mm}`;
}

export interface MonthTotals {
  monthKey: string;
  totalCents: number;
  count: number;
}

/** Totaux des N derniers mois (le mois courant inclus), du plus ancien au plus récent. */
export function monthlyTotals(
  lastMonthKey: string,
  months: number,
  monthStartDay: number,
  db: Db = getDb(),
): MonthTotals[] {
  const result: MonthTotals[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const key = shiftMonthKey(lastMonthKey, -i);
    const { start, end } = rangeForMonthKey(key, monthStartDay);
    const row = db
      .select({ total: sql<number>`coalesce(sum(amount_cents), 0)`, n: sql<number>`count(*)` })
      .from(expenses)
      .where(and(gte(expenses.date, toIsoDate(start)), lt(expenses.date, toIsoDate(end)), eq(expenses.kind, 'expense'), isNull(expenses.deletedAt)))
      .get();
    result.push({ monthKey: key, totalCents: row?.total ?? 0, count: row?.n ?? 0 });
  }
  return result;
}

export function listAllExpenses(db: Db = getDb()): Expense[] {
  return db.select().from(expenses).where(and(eq(expenses.kind, 'expense'), isNull(expenses.deletedAt))).orderBy(desc(expenses.date)).all();
}

// ---------------------------------------------------------------------------
// Récurrences
// ---------------------------------------------------------------------------

export interface RecurringInput {
  amountCents: number;
  categoryId: string;
  paidById: string | null;
  shared: boolean;
  note?: string | null;
  frequency: Frequency;
  nextDate: string;
}

export function listRecurring(db: Db = getDb()): RecurringExpense[] {
  return db.select().from(recurringExpenses).orderBy(recurringExpenses.nextDate).all();
}

export function createRecurring(input: RecurringInput, db: Db = getDb()): RecurringExpense {
  const row: RecurringExpense = {
    id: newId('r_'),
    amountCents: Math.round(input.amountCents),
    categoryId: input.categoryId,
    paidById: input.paidById,
    shared: input.shared,
    note: input.note?.trim() || null,
    frequency: input.frequency,
    nextDate: input.nextDate,
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.insert(recurringExpenses).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateRecurring(
  id: string,
  patch: Partial<RecurringInput & { active: boolean }>,
  db: Db = getDb(),
): void {
  db.update(recurringExpenses).set(patch).where(eq(recurringExpenses.id, id)).run();
  bumpDataVersion();
}

export function deleteRecurring(id: string, db: Db = getDb()): void {
  db.delete(recurringExpenses).where(eq(recurringExpenses.id, id)).run();
  bumpDataVersion();
}

export function nextOccurrence(date: Date, frequency: Frequency): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
  }
}

/**
 * Génère les dépenses des récurrences échues (nextDate ≤ aujourd'hui), en rattrapant
 * les occurrences manquées. Retourne le nombre de dépenses créées.
 */
export function generateDueRecurring(today = new Date(), db: Db = getDb()): number {
  const todayIso = toIsoDate(today);
  const due = db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.active, true), sql`${recurringExpenses.nextDate} <= ${todayIso}`))
    .all();
  let created = 0;
  db.$client.withTransactionSync(() => {
    for (const r of due) {
      let next = fromIsoDate(r.nextDate);
      let guard = 0;
      while (toIsoDate(next) <= todayIso && guard < 120) {
        db.insert(expenses)
          .values({
            id: newId('e_'),
            amountCents: r.amountCents,
            categoryId: r.categoryId,
            date: toIsoDate(next),
            paidById: r.paidById,
            shared: r.shared,
            note: r.note,
            recurringId: r.id,
            importKey: null,
            kind: 'expense',
            accountId: defaultAccount(db)?.id ?? null,
            toAccountId: null,
            incomeSource: null,
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdAt: new Date().toISOString(),
          })
          .run();
        created += 1;
        next = nextOccurrence(next, r.frequency);
        guard += 1;
      }
      db.update(recurringExpenses)
        .set({ nextDate: toIsoDate(next) })
        .where(eq(recurringExpenses.id, r.id))
        .run();
    }
  });
  if (created > 0) bumpDataVersion();
  return created;
}

export type { SplitMode };
