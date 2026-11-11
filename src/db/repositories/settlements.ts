/** Règlements mensuels « qui doit quoi ». */
import { desc, eq } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { settlements, type Settlement } from '../schema';

export function getSettlementForMonth(monthKey: string, db: Db = getDb()): Settlement | undefined {
  return db.select().from(settlements).where(eq(settlements.monthKey, monthKey)).get();
}

export function listSettlements(db: Db = getDb()): Settlement[] {
  return db.select().from(settlements).orderBy(desc(settlements.monthKey)).all();
}

export function markSettled(
  input: { monthKey: string; fromPersonId: string; toPersonId: string; amountCents: number },
  db: Db = getDb(),
): Settlement {
  const row: Settlement = { id: newId('s_'), ...input, settledAt: new Date().toISOString() };
  db.insert(settlements).values(row).run();
  bumpDataVersion();
  return row;
}

export function unmarkSettled(id: string, db: Db = getDb()): void {
  db.delete(settlements).where(eq(settlements.id, id)).run();
  bumpDataVersion();
}
