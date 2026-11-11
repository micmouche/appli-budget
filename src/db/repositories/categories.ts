/** Catégories de dépenses et enveloppes. */
import { asc, eq, sql } from 'drizzle-orm';

import i18n from '@/i18n';
import { newId } from '@/utils/id';

import { getDb, type Db } from '../client';
import { bumpDataVersion } from '../dataVersion';
import { DEFAULT_CATEGORIES, OTHER_CATEGORY_ID } from '../defaultCategories';
import { categories, expenses, recurringExpenses, type Category } from '../schema';

/** Libellé affiché d'une catégorie (nom personnalisé ou traduction de la clé). */
export function categoryLabel(category: Pick<Category, 'name' | 'nameKey'>): string {
  if (category.name && category.name.trim()) return category.name;
  if (category.nameKey) return i18n.t(`categories.${category.nameKey}`);
  return '?';
}

export function listCategories(db: Db = getDb(), includeArchived = false): Category[] {
  const rows = db.select().from(categories).orderBy(asc(categories.position)).all();
  return includeArchived ? rows : rows.filter((c) => !c.archived);
}

export function getCategory(id: string, db: Db = getDb()): Category | undefined {
  return db.select().from(categories).where(eq(categories.id, id)).get();
}

/** Insère les catégories par défaut si la table est vide. */
export function ensureDefaultCategories(db: Db = getDb()): void {
  const count =
    db
      .select({ n: sql<number>`count(*)` })
      .from(categories)
      .get()?.n ?? 0;
  if (count > 0) return;
  db.$client.withTransactionSync(() => {
    DEFAULT_CATEGORIES.forEach((c, index) => {
      db.insert(categories)
        .values({
          id: c.id,
          nameKey: c.nameKey,
          name: null,
          icon: c.icon,
          colorIndex: c.colorIndex,
          position: index,
          budgetCents: null,
          archived: false,
        })
        .run();
    });
  });
  bumpDataVersion();
}

export function createCategory(
  input: { name: string; icon: string; colorIndex: number },
  db: Db = getDb(),
): Category {
  const position =
    (db
      .select({ m: sql<number>`coalesce(max(position), -1)` })
      .from(categories)
      .get()?.m ?? -1) + 1;
  const row: Category = {
    id: newId('cat_'),
    nameKey: null,
    name: input.name.trim(),
    icon: input.icon,
    colorIndex: input.colorIndex,
    position,
    budgetCents: null,
    archived: false,
  };
  db.insert(categories).values(row).run();
  bumpDataVersion();
  return row;
}

export function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'icon' | 'colorIndex' | 'budgetCents' | 'position'>>,
  db: Db = getDb(),
): void {
  db.update(categories).set(patch).where(eq(categories.id, id)).run();
  bumpDataVersion();
}

export function setCategoryBudget(id: string, budgetCents: number | null, db: Db = getDb()): void {
  updateCategory(id, { budgetCents }, db);
}

/** Nombre de dépenses rattachées (pour l'avertissement avant suppression). */
export function countExpensesInCategory(id: string, db: Db = getDb()): number {
  return (
    db
      .select({ n: sql<number>`count(*)` })
      .from(expenses)
      .where(eq(expenses.categoryId, id))
      .get()?.n ?? 0
  );
}

/** Supprime une catégorie : ses dépenses sont déplacées vers « Autres ». */
export function deleteCategory(id: string, db: Db = getDb()): void {
  if (id === OTHER_CATEGORY_ID) return;
  db.$client.withTransactionSync(() => {
    db.update(expenses).set({ categoryId: OTHER_CATEGORY_ID }).where(eq(expenses.categoryId, id)).run();
    db.update(recurringExpenses)
      .set({ categoryId: OTHER_CATEGORY_ID })
      .where(eq(recurringExpenses.categoryId, id))
      .run();
    db.delete(categories).where(eq(categories.id, id)).run();
  });
  bumpDataVersion();
}
