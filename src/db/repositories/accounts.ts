/** Comptes du quotidien. */
import { asc, eq, isNull, and, sql } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { accounts, expenses, type Account, type AccountType } from '../schema';

export interface AccountInput {
  name: string;
  type: AccountType;
  ownerId: string | null;
  initialBalanceCents: number;
  colorIndex: number;
}

export function listAccounts(db: Db = getDb()): Account[] {
  return db.select().from(accounts).where(and(eq(accounts.archived, false), isNull(accounts.deletedAt))).orderBy(asc(accounts.position)).all();
}

export function getAccount(id: string, db: Db = getDb()): Account | undefined {
  return db.select().from(accounts).where(eq(accounts.id, id)).get();
}

export function defaultAccount(db: Db = getDb()): Account | undefined {
  const list = listAccounts(db);
  return list.find((a) => a.isDefault) ?? list[0];
}

/** Crée le compte courant par défaut s'il n'existe aucun compte et rattache les opérations orphelines. */
export function ensureDefaultAccount(name: string, db: Db = getDb()): Account {
  const existing = defaultAccount(db);
  if (existing) return existing;
  const created = createAccount({ name, type: 'checking', ownerId: null, initialBalanceCents: 0, colorIndex: 0 }, db);
  setDefaultAccount(created.id, db);
  db.update(expenses).set({ accountId: created.id }).where(isNull(expenses.accountId)).run();
  return created;
}

export function createAccount(input: AccountInput, db: Db = getDb()): Account {
  const position = (db.select({ m: sql<number>`coalesce(max(position), -1)` }).from(accounts).get()?.m ?? -1) + 1;
  const now = new Date().toISOString();
  const row: Account = { id: newId('acc_'), ...input, name: input.name.trim(), isDefault: false, position, archived: false, updatedAt: now, deletedAt: null, createdAt: now };
  db.insert(accounts).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateAccount(id: string, patch: Partial<AccountInput>, db: Db = getDb()): void {
  db.update(accounts).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(accounts.id, id)).run();
  bumpDataVersion();
}

export function setDefaultAccount(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.update(accounts).set({ isDefault: false }).run();
    db.update(accounts).set({ isDefault: true, updatedAt: new Date().toISOString() }).where(eq(accounts.id, id)).run();
  });
  bumpDataVersion();
}

export function countOperationsInAccount(id: string, db: Db = getDb()): number {
  return db.select({ n: sql<number>`count(*)` }).from(expenses).where(sql`(${expenses.accountId} = ${id} OR ${expenses.toAccountId} = ${id}) AND ${expenses.deletedAt} IS NULL`).get()?.n ?? 0;
}

/** Supprime (marquage) un compte ; ses opérations sont déplacées vers le compte cible. */
export function deleteAccount(id: string, targetId: string, db: Db = getDb()): void {
  const now = new Date().toISOString();
  db.$client.withTransactionSync(() => {
    db.update(expenses).set({ accountId: targetId, updatedAt: now }).where(eq(expenses.accountId, id)).run();
    db.update(expenses).set({ toAccountId: targetId, updatedAt: now }).where(eq(expenses.toAccountId, id)).run();
    db.update(accounts).set({ deletedAt: now, archived: true, isDefault: false, updatedAt: now }).where(eq(accounts.id, id)).run();
  });
  const remaining = listAccounts(db);
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) setDefaultAccount(remaining[0]!.id, db);
  bumpDataVersion();
}
