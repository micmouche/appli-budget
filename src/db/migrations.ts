/**
 * Migrations SQL versionnées, appliquées via PRAGMA user_version.
 * Règle : on n'édite JAMAIS une migration déjà publiée ; on en ajoute une nouvelle.
 * Le SQL doit rester synchronisé avec `schema.ts`.
 */
export interface Migration {
  version: number;
  description: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Socle + module Budget',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        monthly_income_cents INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name_key TEXT,
        name TEXT,
        icon TEXT NOT NULL,
        color_index INTEGER NOT NULL DEFAULT 7,
        position INTEGER NOT NULL DEFAULT 0,
        budget_cents INTEGER,
        archived INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount_cents INTEGER NOT NULL,
        category_id TEXT NOT NULL,
        date TEXT NOT NULL,
        paid_by_id TEXT,
        shared INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        recurring_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount_cents INTEGER NOT NULL,
        category_id TEXT NOT NULL,
        paid_by_id TEXT,
        shared INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        frequency TEXT NOT NULL,
        next_date TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settlements (
        id TEXT PRIMARY KEY NOT NULL,
        month_key TEXT NOT NULL,
        from_person_id TEXT NOT NULL,
        to_person_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        settled_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    description: 'Module Épargne : comptes, mouvements, objectifs',
    sql: `
      CREATE TABLE IF NOT EXISTS savings_accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        rate_pct_x100 INTEGER,
        ceiling_cents INTEGER,
        color_index INTEGER NOT NULL DEFAULT 2,
        position INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS savings_movements (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_savings_movements_account ON savings_movements(account_id, date);
      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'Target',
        target_cents INTEGER NOT NULL,
        target_date TEXT,
        account_ids TEXT NOT NULL DEFAULT '[]',
        color_index INTEGER NOT NULL DEFAULT 2,
        achieved_at TEXT,
        created_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 3,
    description: "Module Immobilier : scénarios d'achat",
    sql: `
      CREATE TABLE IF NOT EXISTS property_scenarios (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        condition TEXT NOT NULL DEFAULT 'old',
        increased_department INTEGER NOT NULL DEFAULT 0,
        down_payment_cents INTEGER NOT NULL DEFAULT 0,
        rate_x100 INTEGER NOT NULL,
        insurance_x100 INTEGER NOT NULL DEFAULT 0,
        months INTEGER NOT NULL,
        application_fee_cents INTEGER NOT NULL DEFAULT 0,
        guarantee_fee_cents INTEGER NOT NULL DEFAULT 0,
        monthly_net_income_cents INTEGER NOT NULL DEFAULT 0,
        monthly_existing_charges_cents INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 4,
    description: 'Module Locatif : logements, baux, échéances, charges',
    sql: `
      CREATE TABLE IF NOT EXISTS rental_properties (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'apartment',
        surface_m2_x10 INTEGER,
        purchase_price_cents INTEGER NOT NULL DEFAULT 0,
        acquisition_costs_cents INTEGER NOT NULL DEFAULT 0,
        initial_works_cents INTEGER NOT NULL DEFAULT 0,
        annual_property_tax_cents INTEGER NOT NULL DEFAULT 0,
        annual_condo_cents INTEGER NOT NULL DEFAULT 0,
        annual_insurance_cents INTEGER NOT NULL DEFAULT 0,
        annual_management_cents INTEGER NOT NULL DEFAULT 0,
        annual_other_cents INTEGER NOT NULL DEFAULT 0,
        monthly_loan_payment_cents INTEGER NOT NULL DEFAULT 0,
        annual_loan_interest_cents INTEGER NOT NULL DEFAULT 0,
        color_index INTEGER NOT NULL DEFAULT 6,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS leases (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        tenant_name TEXT NOT NULL,
        tenant_email TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        rent_cents INTEGER NOT NULL,
        charges_cents INTEGER NOT NULL DEFAULT 0,
        deposit_cents INTEGER NOT NULL DEFAULT 0,
        due_day INTEGER NOT NULL DEFAULT 1,
        furnished INTEGER NOT NULL DEFAULT 0,
        irl_index_x100 INTEGER,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
      CREATE TABLE IF NOT EXISTS rent_payments (
        id TEXT PRIMARY KEY NOT NULL,
        lease_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        period_key TEXT NOT NULL,
        due_date TEXT NOT NULL,
        rent_cents INTEGER NOT NULL,
        charges_cents INTEGER NOT NULL DEFAULT 0,
        paid_cents INTEGER NOT NULL DEFAULT 0,
        paid_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_rent_payments_lease_period ON rent_payments(lease_id, period_key);
      CREATE TABLE IF NOT EXISTS rental_charges (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        date TEXT NOT NULL,
        nature TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_rental_charges_property ON rental_charges(property_id, date);
    `,
  },
  {
    version: 5,
    description: 'Module Travaux : chantiers, lots, devis, paiements',
    sql: `
      CREATE TABLE IF NOT EXISTS work_projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        property_id TEXT,
        budget_cents INTEGER NOT NULL DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        color_index INTEGER NOT NULL DEFAULT 3,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS work_lots (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'other',
        budget_cents INTEGER NOT NULL DEFAULT 0,
        vat_rate_x10 INTEGER NOT NULL DEFAULT 100,
        start_date TEXT,
        end_date TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_lots_project ON work_lots(project_id);
      CREATE TABLE IF NOT EXISTS work_quotes (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL,
        lot_id TEXT NOT NULL,
        contractor TEXT NOT NULL,
        amount_excl_vat_cents INTEGER NOT NULL,
        vat_rate_x10 INTEGER NOT NULL DEFAULT 100,
        status TEXT NOT NULL DEFAULT 'received',
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_quotes_project ON work_quotes(project_id, lot_id);
      CREATE TABLE IF NOT EXISTS work_payments (
        id TEXT PRIMARY KEY NOT NULL,
        project_id TEXT NOT NULL,
        lot_id TEXT,
        label TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'deposit',
        amount_cents INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        paid_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_payments_project ON work_payments(project_id, due_date);
    `,
  },
  {
    version: 6,
    description: 'Import de relevés bancaires : empreinte anti-doublon et règles apprises',
    sql: `
      ALTER TABLE expenses ADD COLUMN import_key TEXT;
      CREATE INDEX IF NOT EXISTS idx_expenses_import_key ON expenses(import_key);
      CREATE TABLE IF NOT EXISTS import_rules (
        pattern TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
];

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1]?.version ?? 0;
