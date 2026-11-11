/** Règles de catégorisation apprises lors des imports de relevés. */
import { eq, sql } from 'drizzle-orm';

import { getDb, type Db } from '../client';
import { expenses, importRules } from '../schema';

export function loadImportRules(db: Db = getDb()): Map<string, string> {
  return new Map(
    db
      .select()
      .from(importRules)
      .all()
      .map((r) => [r.pattern, r.categoryId]),
  );
}

export function saveImportRule(pattern: string, categoryId: string, db: Db = getDb()): void {
  if (!pattern) return;
  db.insert(importRules)
    .values({ pattern, categoryId, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: importRules.pattern,
      set: { categoryId, updatedAt: new Date().toISOString() },
    })
    .run();
}

/** Clés d'import déjà présentes (anti-doublon). */
export function existingImportKeys(keys: readonly string[], db: Db = getDb()): Set<string> {
  if (keys.length === 0) return new Set();
  const rows = db
    .select({ k: expenses.importKey })
    .from(expenses)
    .where(
      sql`${expenses.importKey} IN (${sql.join(
        keys.map((k) => sql`${k}`),
        sql`, `,
      )})`,
    )
    .all();
  return new Set(rows.map((r) => r.k).filter((k): k is string => Boolean(k)));
}

export function deleteImportRule(pattern: string, db: Db = getDb()): void {
  db.delete(importRules).where(eq(importRules.pattern, pattern)).run();
}
