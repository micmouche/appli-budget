/** Dépôts du module Travaux. */
import { asc, desc, eq, sql } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import {
  workLots,
  workPayments,
  workProjects,
  workQuotes,
  type WorkLot,
  type WorkPayment,
  type WorkProject,
  type WorkQuote,
} from '../schema';

export type ProjectInput = Omit<WorkProject, 'id' | 'createdAt' | 'archived'>;
export type LotInput = Omit<WorkLot, 'id' | 'createdAt' | 'position'>;
export type QuoteInput = Omit<WorkQuote, 'id' | 'createdAt'>;
export type WorkPaymentInput = Omit<WorkPayment, 'id' | 'createdAt'>;

export function listProjects(db: Db = getDb()): WorkProject[] {
  return db
    .select()
    .from(workProjects)
    .where(eq(workProjects.archived, false))
    .orderBy(desc(workProjects.createdAt))
    .all();
}
export function getProject(id: string, db: Db = getDb()): WorkProject | undefined {
  return db.select().from(workProjects).where(eq(workProjects.id, id)).get();
}
export function createProject(input: ProjectInput, db: Db = getDb()): WorkProject {
  const row: WorkProject = {
    id: newId('wp_'),
    ...input,
    name: input.name.trim(),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  db.insert(workProjects).values(row).run();
  bumpDataVersion();
  return row;
}
export function updateProject(id: string, patch: Partial<ProjectInput>, db: Db = getDb()): void {
  db.update(workProjects).set(patch).where(eq(workProjects.id, id)).run();
  bumpDataVersion();
}
export function deleteProject(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.delete(workPayments).where(eq(workPayments.projectId, id)).run();
    db.delete(workQuotes).where(eq(workQuotes.projectId, id)).run();
    db.delete(workLots).where(eq(workLots.projectId, id)).run();
    db.delete(workProjects).where(eq(workProjects.id, id)).run();
  });
  bumpDataVersion();
}

export function listLots(db: Db = getDb()): WorkLot[] {
  return db.select().from(workLots).orderBy(asc(workLots.position), asc(workLots.createdAt)).all();
}
export function getLot(id: string, db: Db = getDb()): WorkLot | undefined {
  return db.select().from(workLots).where(eq(workLots.id, id)).get();
}
export function createLot(input: LotInput, db: Db = getDb()): WorkLot {
  const position =
    (db
      .select({ m: sql<number>`coalesce(max(position), -1)` })
      .from(workLots)
      .where(eq(workLots.projectId, input.projectId))
      .get()?.m ?? -1) + 1;
  const row: WorkLot = {
    id: newId('wl_'),
    ...input,
    name: input.name.trim(),
    position,
    createdAt: new Date().toISOString(),
  };
  db.insert(workLots).values(row).run();
  bumpDataVersion();
  return row;
}
export function updateLot(id: string, patch: Partial<LotInput>, db: Db = getDb()): void {
  db.update(workLots).set(patch).where(eq(workLots.id, id)).run();
  bumpDataVersion();
}
export function deleteLot(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.delete(workQuotes).where(eq(workQuotes.lotId, id)).run();
    db.update(workPayments).set({ lotId: null }).where(eq(workPayments.lotId, id)).run();
    db.delete(workLots).where(eq(workLots.id, id)).run();
  });
  bumpDataVersion();
}

export function listQuotes(db: Db = getDb()): WorkQuote[] {
  return db.select().from(workQuotes).orderBy(desc(workQuotes.date)).all();
}
export function getQuote(id: string, db: Db = getDb()): WorkQuote | undefined {
  return db.select().from(workQuotes).where(eq(workQuotes.id, id)).get();
}
export function createQuote(input: QuoteInput, db: Db = getDb()): WorkQuote {
  const row: WorkQuote = {
    id: newId('wq_'),
    ...input,
    contractor: input.contractor.trim(),
    note: input.note?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  db.insert(workQuotes).values(row).run();
  bumpDataVersion();
  return row;
}
export function updateQuote(id: string, patch: Partial<QuoteInput>, db: Db = getDb()): void {
  db.update(workQuotes).set(patch).where(eq(workQuotes.id, id)).run();
  bumpDataVersion();
}
/** Retient un devis : les autres devis du même lot passent en « refusé ». */
export function acceptQuote(id: string, db: Db = getDb()): void {
  const quote = getQuote(id, db);
  if (!quote) return;
  db.$client.withTransactionSync(() => {
    db.update(workQuotes).set({ status: 'rejected' }).where(eq(workQuotes.lotId, quote.lotId)).run();
    db.update(workQuotes).set({ status: 'accepted' }).where(eq(workQuotes.id, id)).run();
  });
  bumpDataVersion();
}
export function deleteQuote(id: string, db: Db = getDb()): void {
  db.delete(workQuotes).where(eq(workQuotes.id, id)).run();
  bumpDataVersion();
}

export function listWorkPayments(db: Db = getDb()): WorkPayment[] {
  return db.select().from(workPayments).orderBy(asc(workPayments.dueDate)).all();
}
export function getWorkPayment(id: string, db: Db = getDb()): WorkPayment | undefined {
  return db.select().from(workPayments).where(eq(workPayments.id, id)).get();
}
export function createWorkPayment(input: WorkPaymentInput, db: Db = getDb()): WorkPayment {
  const row: WorkPayment = {
    id: newId('wpay_'),
    ...input,
    label: input.label.trim(),
    createdAt: new Date().toISOString(),
  };
  db.insert(workPayments).values(row).run();
  bumpDataVersion();
  return row;
}
export function updateWorkPayment(id: string, patch: Partial<WorkPaymentInput>, db: Db = getDb()): void {
  db.update(workPayments).set(patch).where(eq(workPayments.id, id)).run();
  bumpDataVersion();
}
export function deleteWorkPayment(id: string, db: Db = getDb()): void {
  db.delete(workPayments).where(eq(workPayments.id, id)).run();
  bumpDataVersion();
}
