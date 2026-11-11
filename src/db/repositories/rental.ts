/** Dépôts du module Locatif. */
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import { dueDateFor, periodsToGenerate, toIso } from '@/features/rental/logic';
import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import {
  leases,
  rentPayments,
  rentalCharges,
  rentalProperties,
  type ChargeNature,
  type Lease,
  type RentPayment,
  type RentalCharge,
  type RentalProperty,
} from '../schema';

// Logements -----------------------------------------------------------------

export type PropertyInput = Omit<RentalProperty, 'id' | 'createdAt' | 'archived'>;

export function listProperties(db: Db = getDb()): RentalProperty[] {
  return db
    .select()
    .from(rentalProperties)
    .where(eq(rentalProperties.archived, false))
    .orderBy(asc(rentalProperties.createdAt))
    .all();
}

export function getProperty(id: string, db: Db = getDb()): RentalProperty | undefined {
  return db.select().from(rentalProperties).where(eq(rentalProperties.id, id)).get();
}

export function createProperty(input: PropertyInput, db: Db = getDb()): RentalProperty {
  const row: RentalProperty = {
    id: newId('rp_'),
    ...input,
    name: input.name.trim(),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  db.insert(rentalProperties).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateProperty(id: string, patch: Partial<PropertyInput>, db: Db = getDb()): void {
  db.update(rentalProperties).set(patch).where(eq(rentalProperties.id, id)).run();
  bumpDataVersion();
}

export function deleteProperty(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.delete(rentPayments).where(eq(rentPayments.propertyId, id)).run();
    db.delete(rentalCharges).where(eq(rentalCharges.propertyId, id)).run();
    db.delete(leases).where(eq(leases.propertyId, id)).run();
    db.delete(rentalProperties).where(eq(rentalProperties.id, id)).run();
  });
  bumpDataVersion();
}

// Baux ----------------------------------------------------------------------

export type LeaseInput = Omit<Lease, 'id' | 'createdAt'>;

export function listLeases(db: Db = getDb()): Lease[] {
  return db.select().from(leases).orderBy(desc(leases.startDate)).all();
}

export function activeLeaseFor(propertyId: string, db: Db = getDb()): Lease | undefined {
  return db
    .select()
    .from(leases)
    .where(and(eq(leases.propertyId, propertyId), isNull(leases.endDate)))
    .orderBy(desc(leases.startDate))
    .get();
}

export function getLease(id: string, db: Db = getDb()): Lease | undefined {
  return db.select().from(leases).where(eq(leases.id, id)).get();
}

export function createLease(input: LeaseInput, db: Db = getDb()): Lease {
  const row: Lease = {
    id: newId('ls_'),
    ...input,
    tenantName: input.tenantName.trim(),
    createdAt: new Date().toISOString(),
  };
  db.insert(leases).values(row).run();
  generateRentSchedule(db);
  bumpDataVersion();
  return row;
}

export function updateLease(id: string, patch: Partial<LeaseInput>, db: Db = getDb()): void {
  db.update(leases).set(patch).where(eq(leases.id, id)).run();
  // Les échéances futures non encaissées suivent le nouveau loyer.
  if (patch.rentCents !== undefined || patch.chargesCents !== undefined || patch.dueDay !== undefined) {
    const lease = getLease(id, db);
    if (lease) {
      const today = toIso(new Date());
      const pending = db
        .select()
        .from(rentPayments)
        .where(and(eq(rentPayments.leaseId, id), eq(rentPayments.paidCents, 0)))
        .all();
      for (const p of pending) {
        if (p.dueDate >= today.slice(0, 7)) {
          db.update(rentPayments)
            .set({
              rentCents: lease.rentCents,
              chargesCents: lease.chargesCents,
              dueDate: dueDateFor(p.periodKey, lease.dueDay),
            })
            .where(eq(rentPayments.id, p.id))
            .run();
        }
      }
    }
  }
  generateRentSchedule(db);
  bumpDataVersion();
}

export function deleteLease(id: string, db: Db = getDb()): void {
  db.$client.withTransactionSync(() => {
    db.delete(rentPayments).where(eq(rentPayments.leaseId, id)).run();
    db.delete(leases).where(eq(leases.id, id)).run();
  });
  bumpDataVersion();
}

// Échéances -----------------------------------------------------------------

/** Crée les échéances manquantes de tous les baux actifs jusqu'au mois courant. Retourne le nombre créé. */
export function generateRentSchedule(db: Db = getDb(), today = new Date()): number {
  const todayIso = toIso(today);
  const all = db.select().from(leases).all();
  let created = 0;
  db.$client.withTransactionSync(() => {
    for (const lease of all) {
      const periods = periodsToGenerate(lease.startDate, lease.endDate, todayIso);
      for (const periodKey of periods) {
        const exists =
          db
            .select({ n: sql<number>`count(*)` })
            .from(rentPayments)
            .where(and(eq(rentPayments.leaseId, lease.id), eq(rentPayments.periodKey, periodKey)))
            .get()?.n ?? 0;
        if (exists > 0) continue;
        db.insert(rentPayments)
          .values({
            id: newId('rpay_'),
            leaseId: lease.id,
            propertyId: lease.propertyId,
            periodKey,
            dueDate: dueDateFor(periodKey, lease.dueDay),
            rentCents: lease.rentCents,
            chargesCents: lease.chargesCents,
            paidCents: 0,
            paidAt: null,
            createdAt: new Date().toISOString(),
          })
          .run();
        created += 1;
      }
    }
  });
  if (created > 0) bumpDataVersion();
  return created;
}

export function listPayments(db: Db = getDb()): RentPayment[] {
  return db.select().from(rentPayments).orderBy(desc(rentPayments.periodKey)).all();
}

export function listPaymentsForProperty(propertyId: string, db: Db = getDb()): RentPayment[] {
  return db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.propertyId, propertyId))
    .orderBy(desc(rentPayments.periodKey))
    .all();
}

export function getPayment(id: string, db: Db = getDb()): RentPayment | undefined {
  return db.select().from(rentPayments).where(eq(rentPayments.id, id)).get();
}

export function recordPayment(id: string, paidCents: number, paidAt: string | null, db: Db = getDb()): void {
  db.update(rentPayments)
    .set({ paidCents: Math.max(0, Math.round(paidCents)), paidAt: paidCents > 0 ? paidAt : null })
    .where(eq(rentPayments.id, id))
    .run();
  bumpDataVersion();
}

// Charges -------------------------------------------------------------------

export interface ChargeInput {
  propertyId: string;
  date: string;
  nature: ChargeNature;
  amountCents: number;
  note?: string | null;
}

export function listCharges(db: Db = getDb()): RentalCharge[] {
  return db.select().from(rentalCharges).orderBy(desc(rentalCharges.date)).all();
}

export function listChargesForProperty(propertyId: string, db: Db = getDb()): RentalCharge[] {
  return db
    .select()
    .from(rentalCharges)
    .where(eq(rentalCharges.propertyId, propertyId))
    .orderBy(desc(rentalCharges.date))
    .all();
}

export function getCharge(id: string, db: Db = getDb()): RentalCharge | undefined {
  return db.select().from(rentalCharges).where(eq(rentalCharges.id, id)).get();
}

export function createCharge(input: ChargeInput, db: Db = getDb()): RentalCharge {
  const row: RentalCharge = {
    id: newId('rc_'),
    propertyId: input.propertyId,
    date: input.date,
    nature: input.nature,
    amountCents: Math.round(input.amountCents),
    note: input.note?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  db.insert(rentalCharges).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateCharge(id: string, patch: Partial<ChargeInput>, db: Db = getDb()): void {
  db.update(rentalCharges)
    .set({ ...patch, note: patch.note === undefined ? undefined : patch.note?.trim() || null })
    .where(eq(rentalCharges.id, id))
    .run();
  bumpDataVersion();
}

export function deleteCharge(id: string, db: Db = getDb()): void {
  db.delete(rentalCharges).where(eq(rentalCharges.id, id)).run();
  bumpDataVersion();
}
