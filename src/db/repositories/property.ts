/** Dépôt des scénarios d'achat immobilier. */
import { desc, eq } from 'drizzle-orm';

import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { propertyScenarios, type PropertyScenario } from '../schema';

export type ScenarioInputRow = Omit<PropertyScenario, 'id' | 'createdAt' | 'updatedAt'>;

export function listScenarios(db: Db = getDb()): PropertyScenario[] {
  return db.select().from(propertyScenarios).orderBy(desc(propertyScenarios.updatedAt)).all();
}

export function getScenario(id: string, db: Db = getDb()): PropertyScenario | undefined {
  return db.select().from(propertyScenarios).where(eq(propertyScenarios.id, id)).get();
}

export function createScenario(input: ScenarioInputRow, db: Db = getDb()): PropertyScenario {
  const now = new Date().toISOString();
  const row: PropertyScenario = {
    id: newId('ps_'),
    ...input,
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.insert(propertyScenarios).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateScenario(id: string, patch: Partial<ScenarioInputRow>, db: Db = getDb()): void {
  db.update(propertyScenarios)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(propertyScenarios.id, id))
    .run();
  bumpDataVersion();
}

export function deleteScenario(id: string, db: Db = getDb()): void {
  db.delete(propertyScenarios).where(eq(propertyScenarios.id, id)).run();
  bumpDataVersion();
}
