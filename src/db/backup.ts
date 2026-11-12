/**
 * Export / import JSON complet (portabilité RGPD, sauvegarde manuelle).
 * Le format est versionné ; l'import valide la structure avant d'écraser.
 */
import { clearDataTables, getDb } from './client';
import { bumpDataVersion } from './dataVersion';
import {
  categories,
  expenses,
  persons,
  recurringExpenses,
  savingsAccounts,
  savingsGoals,
  savingsMovements,
  settlements,
  propertyScenarios,
  rentalProperties,
  leases,
  rentPayments,
  rentalCharges,
  workProjects,
  workLots,
  workQuotes,
  workPayments,
  importRules, accounts } from './schema';
import type {
  Category,
  Expense,
  Person,
  RecurringExpense,
  SavingsAccount,
  SavingsGoal,
  SavingsMovement,
  Settlement,
  PropertyScenario,
  RentalProperty,
  Lease,
  RentPayment,
  RentalCharge,
  WorkProject,
  WorkLot,
  WorkQuote,
  WorkPayment,
  ImportRule, Account } from './schema';

export const BACKUP_FORMAT = 'pecule-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: string;
  data: {
    persons: Person[];
    categories: Category[];
    expenses: Expense[];
    recurringExpenses: RecurringExpense[];
    settlements: Settlement[];
    savingsAccounts?: SavingsAccount[];
    savingsMovements?: SavingsMovement[];
    savingsGoals?: SavingsGoal[];
    propertyScenarios?: PropertyScenario[];
    rentalProperties?: RentalProperty[];
    leases?: Lease[];
    rentPayments?: RentPayment[];
    rentalCharges?: RentalCharge[];
    workProjects?: WorkProject[];
    workLots?: WorkLot[];
    workQuotes?: WorkQuote[];
    workPayments?: WorkPayment[];
    importRules?: ImportRule[];
    accounts?: Account[];
  };
}

export function createBackup(): Backup {
  const db = getDb();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'pecule',
    data: {
      persons: db.select().from(persons).all(),
      categories: db.select().from(categories).all(),
      expenses: db.select().from(expenses).all(),
      recurringExpenses: db.select().from(recurringExpenses).all(),
      settlements: db.select().from(settlements).all(),
      savingsAccounts: db.select().from(savingsAccounts).all(),
      savingsMovements: db.select().from(savingsMovements).all(),
      savingsGoals: db.select().from(savingsGoals).all(),
      propertyScenarios: db.select().from(propertyScenarios).all(),
      rentalProperties: db.select().from(rentalProperties).all(),
      leases: db.select().from(leases).all(),
      rentPayments: db.select().from(rentPayments).all(),
      rentalCharges: db.select().from(rentalCharges).all(),
      workProjects: db.select().from(workProjects).all(),
      workLots: db.select().from(workLots).all(),
      workQuotes: db.select().from(workQuotes).all(),
      workPayments: db.select().from(workPayments).all(),
      importRules: db.select().from(importRules).all(),
      accounts: db.select().from(accounts).all(),
    },
  };
}

export function parseBackup(text: string): Backup | null {
  try {
    const parsed = JSON.parse(text) as Partial<Backup>;
    if (
      parsed.format !== BACKUP_FORMAT ||
      typeof parsed.version !== 'number' ||
      parsed.version > BACKUP_VERSION
    )
      return null;
    const d = parsed.data;
    if (!d || !Array.isArray(d.persons) || !Array.isArray(d.categories) || !Array.isArray(d.expenses))
      return null;
    return {
      format: BACKUP_FORMAT,
      version: parsed.version,
      exportedAt: parsed.exportedAt ?? '',
      app: parsed.app ?? 'pecule',
      data: {
        persons: d.persons,
        categories: d.categories,
        expenses: d.expenses,
        recurringExpenses: Array.isArray(d.recurringExpenses) ? d.recurringExpenses : [],
        settlements: Array.isArray(d.settlements) ? d.settlements : [],
        savingsAccounts: Array.isArray(d.savingsAccounts) ? d.savingsAccounts : [],
        savingsMovements: Array.isArray(d.savingsMovements) ? d.savingsMovements : [],
        savingsGoals: Array.isArray(d.savingsGoals) ? d.savingsGoals : [],
        propertyScenarios: Array.isArray(d.propertyScenarios) ? d.propertyScenarios : [],
        rentalProperties: Array.isArray(d.rentalProperties) ? d.rentalProperties : [],
        leases: Array.isArray(d.leases) ? d.leases : [],
        rentPayments: Array.isArray(d.rentPayments) ? d.rentPayments : [],
        rentalCharges: Array.isArray(d.rentalCharges) ? d.rentalCharges : [],
        workProjects: Array.isArray(d.workProjects) ? d.workProjects : [],
        workLots: Array.isArray(d.workLots) ? d.workLots : [],
        workQuotes: Array.isArray(d.workQuotes) ? d.workQuotes : [],
        workPayments: Array.isArray(d.workPayments) ? d.workPayments : [],
        importRules: Array.isArray(d.importRules) ? d.importRules : [],
        accounts: Array.isArray(d.accounts) ? d.accounts : [],
      },
    };
  } catch {
    return null;
  }
}

/** Remplace toutes les données de la base active par celles de la sauvegarde. */
export function restoreBackup(backup: Backup): void {
  const db = getDb();
  clearDataTables(db);
  db.$client.withTransactionSync(() => {
    for (const p of backup.data.persons) db.insert(persons).values(p).run();
    for (const c of backup.data.categories) db.insert(categories).values(c).run();
    for (const e of backup.data.expenses) db.insert(expenses).values(e).run();
    for (const r of backup.data.recurringExpenses) db.insert(recurringExpenses).values(r).run();
    for (const s of backup.data.settlements) db.insert(settlements).values(s).run();
    for (const a of backup.data.savingsAccounts ?? []) db.insert(savingsAccounts).values(a).run();
    for (const m of backup.data.savingsMovements ?? []) db.insert(savingsMovements).values(m).run();
    for (const g of backup.data.savingsGoals ?? []) db.insert(savingsGoals).values(g).run();
    for (const sc of backup.data.propertyScenarios ?? []) db.insert(propertyScenarios).values(sc).run();
    for (const r of backup.data.rentalProperties ?? []) db.insert(rentalProperties).values(r).run();
    for (const l of backup.data.leases ?? []) db.insert(leases).values(l).run();
    for (const pay of backup.data.rentPayments ?? []) db.insert(rentPayments).values(pay).run();
    for (const c of backup.data.rentalCharges ?? []) db.insert(rentalCharges).values(c).run();
    for (const w of backup.data.workProjects ?? []) db.insert(workProjects).values(w).run();
    for (const l of backup.data.workLots ?? []) db.insert(workLots).values(l).run();
    for (const q of backup.data.workQuotes ?? []) db.insert(workQuotes).values(q).run();
    for (const wp of backup.data.workPayments ?? []) db.insert(workPayments).values(wp).run();
    for (const ir of backup.data.importRules ?? []) db.insert(importRules).values(ir).run();
    for (const a of backup.data.accounts ?? []) db.insert(accounts).values(a).run();
  });
  bumpDataVersion();
}
