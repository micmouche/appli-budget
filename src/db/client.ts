/**
 * Ouverture des bases SQLite et exécution des migrations.
 *
 * Deux bases distinctes :
 * - `pecule.db` : données réelles + préférences de l'app ;
 * - `pecule-demo.db` : jeu de démonstration, jamais mélangé au réel.
 *
 * `getDb()` retourne la base « active » pour les données (réelle ou démo) ;
 * `getAppDb()` retourne toujours la base réelle (préférences).
 */
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { migrations } from './migrations';
import * as schema from './schema';

export type Db = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

export const APP_DB_NAME = 'pecule.db';
export const DEMO_DB_NAME = 'pecule-demo.db';

const instances = new Map<string, Db>();
let demoActive = false;

/** Applique les migrations manquantes (idempotent). */
export function runMigrations(client: SQLiteDatabase): number {
  const row = client.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  for (const migration of migrations) {
    if (migration.version <= current) continue;
    client.withTransactionSync(() => {
      client.execSync(migration.sql);
      client.execSync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
  return current;
}

function open(name: string): Db {
  const existing = instances.get(name);
  if (existing) return existing;
  // Sur le web (aperçu de démonstration), la base vit en mémoire : rien n'est persisté entre deux chargements.
  const client = openDatabaseSync(Platform.OS === 'web' ? ':memory:' : name);
  if (Platform.OS !== 'web') client.execSync('PRAGMA journal_mode = WAL;');
  client.execSync('PRAGMA foreign_keys = ON;');
  runMigrations(client);
  const db = drizzle(client, { schema }) as Db;
  instances.set(name, db);
  return db;
}

export function getAppDb(): Db {
  return open(APP_DB_NAME);
}

export function getDemoDb(): Db {
  return open(DEMO_DB_NAME);
}

export function setDemoActive(active: boolean): void {
  demoActive = active;
}

export function isDemoActive(): boolean {
  return demoActive;
}

/** Base active pour les données métier. */
export function getDb(): Db {
  return demoActive ? getDemoDb() : getAppDb();
}

/** Vide toutes les tables de données d'une base (préférences conservées). */
export function clearDataTables(db: Db): void {
  db.$client.withTransactionSync(() => {
    db.$client.execSync(
      'DELETE FROM expenses; DELETE FROM recurring_expenses; DELETE FROM settlements; DELETE FROM categories; DELETE FROM persons; DELETE FROM savings_movements; DELETE FROM savings_goals; DELETE FROM savings_accounts; DELETE FROM property_scenarios; DELETE FROM rent_payments; DELETE FROM rental_charges; DELETE FROM leases; DELETE FROM rental_properties; DELETE FROM work_payments; DELETE FROM work_quotes; DELETE FROM work_lots; DELETE FROM work_projects; DELETE FROM import_rules;',
    );
  });
}
