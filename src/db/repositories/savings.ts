/** Dépôts du module Épargne. */
import { asc, desc, eq, sql } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import {
  savingsAccounts,
  savingsGoals,
  savingsMovements,
  type MovementType,
  type SavingsAccount,
  type SavingsGoal,
  type SavingsMovement,
  type SavingsType,
} from '../schema';

// Comptes -------------------------------------------------------------------

export function listSavingsAccounts(db: Db = getDb()): SavingsAccount[] {
  return db
    .select()
    .from(savingsAccounts)
    .where(eq(savingsAccounts.archived, false))
    .orderBy(asc(savingsAccounts.position))
    .all();
}

export function getSavingsAccount(id: string, db: Db = getDb()): SavingsAccount | undefined {
  return db.select().from(savingsAccounts).where(eq(savingsAccounts.id, id)).get();
}

export interface SavingsAccountInput {
  name: string;
  type: SavingsType;
  rateX100: number | null;
  ceilingCents: number | null;
  colorIndex: number;
}

export function createSavingsAccount(
  input: SavingsAccountInput,
  openingBalanceCents = 0,
  db: Db = getDb(),
): SavingsAccount {
  const position =
    (db
      .select({ m: sql<number>`coalesce(max(position), -1)` })
      .from(savingsAccounts)
      .get()?.m ?? -1) + 1;
  const row: SavingsAccount = {
    id: newId('sa_'),
    ...input,
    name: input.name.trim(),
    position,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  db.$client.withTransactionSync(() => {
    db.insert(savingsAccounts).values(row).run();
    if (openingBalanceCents > 0) {
      db.insert(savingsMovements)
        .values({
          id: newId('sm_'),
          accountId: row.id,
          type: 'deposit',
          amountCents: openingBalanceCents,
          date: todayIso(),
          note: null,
          createdAt: new Date().toISOString(),
        })
        .run();
    }
  });
  bumpDataVersion();
  return row;
}

export function updateSavingsAccount(
  id: string,
  patch: Partial<SavingsAccountInput>,
  db: Db = getDb(),
): void {
  db.update(savingsAccounts).set(patch).where(eq(savingsAccounts.id, id)).run();
  bumpDataVersion();
}

export function deleteSavingsAccount(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.delete(savingsMovements).where(eq(savingsMovements.accountId, id)).run();
    db.delete(savingsAccounts).where(eq(savingsAccounts.id, id)).run();
  });
  bumpDataVersion();
}

// Mouvements ----------------------------------------------------------------

export function listSavingsMovements(db: Db = getDb()): SavingsMovement[] {
  return db
    .select()
    .from(savingsMovements)
    .orderBy(desc(savingsMovements.date), desc(savingsMovements.createdAt))
    .all();
}

export function listMovementsForAccount(accountId: string, db: Db = getDb()): SavingsMovement[] {
  return db
    .select()
    .from(savingsMovements)
    .where(eq(savingsMovements.accountId, accountId))
    .orderBy(desc(savingsMovements.date), desc(savingsMovements.createdAt))
    .all();
}

export function getSavingsMovement(id: string, db: Db = getDb()): SavingsMovement | undefined {
  return db.select().from(savingsMovements).where(eq(savingsMovements.id, id)).get();
}

export interface MovementInput {
  accountId: string;
  type: MovementType;
  amountCents: number;
  date: string;
  note?: string | null;
}

export function createSavingsMovement(input: MovementInput, db: Db = getDb()): SavingsMovement {
  const row: SavingsMovement = {
    id: newId('sm_'),
    accountId: input.accountId,
    type: input.type,
    amountCents: Math.abs(Math.round(input.amountCents)),
    date: input.date,
    note: input.note?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  db.insert(savingsMovements).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateSavingsMovement(id: string, patch: Partial<MovementInput>, db: Db = getDb()): void {
  db.update(savingsMovements)
    .set({
      ...patch,
      amountCents: patch.amountCents === undefined ? undefined : Math.abs(Math.round(patch.amountCents)),
      note: patch.note === undefined ? undefined : patch.note?.trim() || null,
    })
    .where(eq(savingsMovements.id, id))
    .run();
  bumpDataVersion();
}

export function deleteSavingsMovement(id: string, db: Db = getDb()): void {
  db.delete(savingsMovements).where(eq(savingsMovements.id, id)).run();
  bumpDataVersion();
}

// Objectifs -----------------------------------------------------------------

export function listSavingsGoals(db: Db = getDb()): SavingsGoal[] {
  return db.select().from(savingsGoals).orderBy(asc(savingsGoals.createdAt)).all();
}

export function getSavingsGoal(id: string, db: Db = getDb()): SavingsGoal | undefined {
  return db.select().from(savingsGoals).where(eq(savingsGoals.id, id)).get();
}

export interface GoalInput {
  name: string;
  icon: string;
  targetCents: number;
  targetDate: string | null;
  accountIds: string[];
  colorIndex: number;
}

export function createSavingsGoal(input: GoalInput, db: Db = getDb()): SavingsGoal {
  const row: SavingsGoal = {
    id: newId('sg_'),
    name: input.name.trim(),
    icon: input.icon,
    targetCents: Math.round(input.targetCents),
    targetDate: input.targetDate,
    accountIds: JSON.stringify(input.accountIds),
    colorIndex: input.colorIndex,
    achievedAt: null,
    createdAt: new Date().toISOString(),
  };
  db.insert(savingsGoals).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateSavingsGoal(
  id: string,
  patch: Partial<GoalInput> & { achievedAt?: string | null },
  db: Db = getDb(),
): void {
  const { accountIds, ...rest } = patch;
  db.update(savingsGoals)
    .set({ ...rest, accountIds: accountIds === undefined ? undefined : JSON.stringify(accountIds) })
    .where(eq(savingsGoals.id, id))
    .run();
  bumpDataVersion();
}

export function deleteSavingsGoal(id: string, db: Db = getDb()): void {
  db.delete(savingsGoals).where(eq(savingsGoals.id, id)).run();
  bumpDataVersion();
}

export function goalAccountIds(goal: SavingsGoal): string[] {
  try {
    const parsed = JSON.parse(goal.accountIds) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
