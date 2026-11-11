/** Membres du foyer. */
import { asc, eq } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { persons, type Person } from '../schema';

export function listPersons(db: Db = getDb()): Person[] {
  return db.select().from(persons).orderBy(asc(persons.position)).all();
}

export function upsertPerson(
  input: { id?: string; name: string; monthlyIncomeCents: number; position: number },
  db: Db = getDb(),
): Person {
  const id = input.id ?? newId('p_');
  const row: Person = {
    id,
    name: input.name.trim() || `Personne ${input.position + 1}`,
    monthlyIncomeCents: Math.max(0, Math.round(input.monthlyIncomeCents)),
    position: input.position,
    createdAt: new Date().toISOString(),
  };
  db.insert(persons)
    .values(row)
    .onConflictDoUpdate({
      target: persons.id,
      set: { name: row.name, monthlyIncomeCents: row.monthlyIncomeCents, position: row.position },
    })
    .run();
  bumpDataVersion();
  return row;
}

export function deletePerson(id: string, db: Db = getDb()): void {
  db.delete(persons).where(eq(persons.id, id)).run();
  bumpDataVersion();
}

/** Garantit l'existence de 1 ou 2 membres selon le réglage « en couple ». */
export function ensureHousehold(couple: boolean, defaultNames: [string, string], db: Db = getDb()): Person[] {
  const existing = listPersons(db);
  if (existing.length === 0) {
    upsertPerson({ name: defaultNames[0], monthlyIncomeCents: 0, position: 0 }, db);
  }
  const afterFirst = listPersons(db);
  if (couple && afterFirst.length < 2) {
    upsertPerson({ name: defaultNames[1], monthlyIncomeCents: 0, position: 1 }, db);
  }
  if (!couple && afterFirst.length > 1) {
    for (const p of afterFirst.slice(1)) deletePerson(p.id, db);
  }
  return listPersons(db);
}
