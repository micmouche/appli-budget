/** Accès clé/valeur JSON dans la table settings de la base réelle. */
import { eq } from 'drizzle-orm';

import { getAppDb } from './client';
import { settings } from './schema';

export function kvGet<T>(key: string): T | undefined {
  const row = getAppDb().select().from(settings).where(eq(settings.key, key)).get();
  if (!row) return undefined;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return undefined;
  }
}

export function kvSet(key: string, value: unknown): void {
  const serialized = JSON.stringify(value);
  getAppDb()
    .insert(settings)
    .values({ key, value: serialized })
    .onConflictDoUpdate({ target: settings.key, set: { value: serialized } })
    .run();
}

export function kvDelete(key: string): void {
  getAppDb().delete(settings).where(eq(settings.key, key)).run();
}
