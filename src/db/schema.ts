/**
 * Schéma Drizzle (SQLite). Les montants sont des centimes entiers, les dates des
 * chaînes ISO « AAAA-MM-JJ » (date locale) ou ISO 8601 complet pour les horodatages.
 * Toute évolution de schéma passe par une migration dans `migrations.ts`.
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Préférences et petits états persistés (JSON sérialisé). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Membres du foyer (1 ou 2). */
export const persons = sqliteTable('persons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  monthlyIncomeCents: integer('monthly_income_cents').notNull().default(0),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

/** Catégories de dépenses (par défaut ou personnalisées). */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  /** Clé i18n pour les catégories par défaut (ex. "food"), null si personnalisée. */
  nameKey: text('name_key'),
  /** Nom saisi par l'utilisateur (prioritaire sur nameKey). */
  name: text('name'),
  /** Nom d'icône Lucide (ex. "ShoppingCart"). */
  icon: text('icon').notNull(),
  /** Index dans la palette catégorielle (0–7). */
  colorIndex: integer('color_index').notNull().default(7),
  position: integer('position').notNull().default(0),
  /** Enveloppe mensuelle en centimes, null = pas d'enveloppe. */
  budgetCents: integer('budget_cents'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  amountCents: integer('amount_cents').notNull(),
  categoryId: text('category_id').notNull(),
  /** « AAAA-MM-JJ ». */
  date: text('date').notNull(),
  paidById: text('paid_by_id'),
  shared: integer('shared', { mode: 'boolean' }).notNull().default(true),
  note: text('note'),
  /** Dépense générée par une récurrence. */
  recurringId: text('recurring_id'),
  /** Empreinte de l'opération bancaire importée (anti-doublon). */
  importKey: text('import_key'),
  createdAt: text('created_at').notNull(),
});

export const recurringExpenses = sqliteTable('recurring_expenses', {
  id: text('id').primaryKey(),
  amountCents: integer('amount_cents').notNull(),
  categoryId: text('category_id').notNull(),
  paidById: text('paid_by_id'),
  shared: integer('shared', { mode: 'boolean' }).notNull().default(true),
  note: text('note'),
  frequency: text('frequency', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
  /** Prochaine date de génération « AAAA-MM-JJ ». */
  nextDate: text('next_date').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

/** Règlements « qui doit quoi » marqués comme effectués. */
export const settlements = sqliteTable('settlements', {
  id: text('id').primaryKey(),
  monthKey: text('month_key').notNull(),
  fromPersonId: text('from_person_id').notNull(),
  toPersonId: text('to_person_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  settledAt: text('settled_at').notNull(),
});

export type Person = typeof persons.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type Frequency = RecurringExpense['frequency'];

// ---------------------------------------------------------------------------
// Module Épargne (migration 2)
// ---------------------------------------------------------------------------

export const SAVINGS_TYPES = [
  'livretA',
  'ldds',
  'lep',
  'pel',
  'cel',
  'livret',
  'assuranceVie',
  'pea',
  'cto',
  'crypto',
  'cash',
  'other',
] as const;
export type SavingsType = (typeof SAVINGS_TYPES)[number];

export const savingsAccounts = sqliteTable('savings_accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: SAVINGS_TYPES }).notNull(),
  /** Taux annuel en % (ex. 1.7), null si non pertinent. */
  rateX100: integer('rate_pct_x100'),
  /** Plafond de versement en centimes, null si aucun. */
  ceilingCents: integer('ceiling_cents'),
  colorIndex: integer('color_index').notNull().default(2),
  position: integer('position').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const savingsMovements = sqliteTable('savings_movements', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  type: text('type', { enum: ['deposit', 'withdrawal', 'interest'] }).notNull(),
  /** Toujours positif ; le signe découle du type. */
  amountCents: integer('amount_cents').notNull(),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const savingsGoals = sqliteTable('savings_goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('Target'),
  targetCents: integer('target_cents').notNull(),
  /** « AAAA-MM-JJ », null si pas de date. */
  targetDate: text('target_date'),
  /** Liste JSON d'identifiants de comptes ; vide = tous les comptes. */
  accountIds: text('account_ids').notNull().default('[]'),
  colorIndex: integer('color_index').notNull().default(2),
  achievedAt: text('achieved_at'),
  createdAt: text('created_at').notNull(),
});

export type SavingsAccount = typeof savingsAccounts.$inferSelect;
export type SavingsMovement = typeof savingsMovements.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type MovementType = SavingsMovement['type'];

// ---------------------------------------------------------------------------
// Module Immobilier (migration 3)
// ---------------------------------------------------------------------------

export const propertyScenarios = sqliteTable('property_scenarios', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  condition: text('condition', { enum: ['old', 'new'] })
    .notNull()
    .default('old'),
  increasedDepartment: integer('increased_department', { mode: 'boolean' }).notNull().default(false),
  downPaymentCents: integer('down_payment_cents').notNull().default(0),
  rateX100: integer('rate_x100').notNull(),
  insuranceX100: integer('insurance_x100').notNull().default(0),
  months: integer('months').notNull(),
  applicationFeeCents: integer('application_fee_cents').notNull().default(0),
  guaranteeFeeCents: integer('guarantee_fee_cents').notNull().default(0),
  monthlyNetIncomeCents: integer('monthly_net_income_cents').notNull().default(0),
  monthlyExistingChargesCents: integer('monthly_existing_charges_cents').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type PropertyScenario = typeof propertyScenarios.$inferSelect;

// ---------------------------------------------------------------------------
// Module Locatif (migration 4)
// ---------------------------------------------------------------------------

export const PROPERTY_TYPES = ['apartment', 'house', 'parking', 'other'] as const;
export const CHARGE_NATURES = [
  'propertyTax',
  'condo',
  'insurance',
  'management',
  'repairs',
  'interest',
  'other',
] as const;

export const rentalProperties = sqliteTable('rental_properties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  type: text('type', { enum: PROPERTY_TYPES }).notNull().default('apartment'),
  surfaceM2x10: integer('surface_m2_x10'),
  purchasePriceCents: integer('purchase_price_cents').notNull().default(0),
  acquisitionCostsCents: integer('acquisition_costs_cents').notNull().default(0),
  initialWorksCents: integer('initial_works_cents').notNull().default(0),
  annualPropertyTaxCents: integer('annual_property_tax_cents').notNull().default(0),
  annualCondoCents: integer('annual_condo_cents').notNull().default(0),
  annualInsuranceCents: integer('annual_insurance_cents').notNull().default(0),
  annualManagementCents: integer('annual_management_cents').notNull().default(0),
  annualOtherCents: integer('annual_other_cents').notNull().default(0),
  monthlyLoanPaymentCents: integer('monthly_loan_payment_cents').notNull().default(0),
  annualLoanInterestCents: integer('annual_loan_interest_cents').notNull().default(0),
  colorIndex: integer('color_index').notNull().default(6),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const leases = sqliteTable('leases', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  tenantName: text('tenant_name').notNull(),
  tenantEmail: text('tenant_email'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  rentCents: integer('rent_cents').notNull(),
  chargesCents: integer('charges_cents').notNull().default(0),
  depositCents: integer('deposit_cents').notNull().default(0),
  dueDay: integer('due_day').notNull().default(1),
  furnished: integer('furnished', { mode: 'boolean' }).notNull().default(false),
  /** Indice IRL de référence × 100 (ex. 14517). */
  irlIndexX100: integer('irl_index_x100'),
  createdAt: text('created_at').notNull(),
});

export const rentPayments = sqliteTable('rent_payments', {
  id: text('id').primaryKey(),
  leaseId: text('lease_id').notNull(),
  propertyId: text('property_id').notNull(),
  /** « AAAA-MM ». */
  periodKey: text('period_key').notNull(),
  dueDate: text('due_date').notNull(),
  rentCents: integer('rent_cents').notNull(),
  chargesCents: integer('charges_cents').notNull().default(0),
  paidCents: integer('paid_cents').notNull().default(0),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
});

export const rentalCharges = sqliteTable('rental_charges', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  date: text('date').notNull(),
  nature: text('nature', { enum: CHARGE_NATURES }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export type RentalProperty = typeof rentalProperties.$inferSelect;
export type Lease = typeof leases.$inferSelect;
export type RentPayment = typeof rentPayments.$inferSelect;
export type RentalCharge = typeof rentalCharges.$inferSelect;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type ChargeNature = (typeof CHARGE_NATURES)[number];

// ---------------------------------------------------------------------------
// Module Travaux (migration 5)
// ---------------------------------------------------------------------------

export const LOT_KINDS = [
  'plumbing',
  'electricity',
  'masonry',
  'carpentry',
  'painting',
  'kitchen',
  'bathroom',
  'insulation',
  'flooring',
  'roofing',
  'heating',
  'other',
] as const;
export const QUOTE_STATUSES = ['received', 'accepted', 'rejected'] as const;
export const WORK_PAYMENT_KINDS = ['deposit', 'progress', 'balance', 'other'] as const;

export const workProjects = sqliteTable('work_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  propertyId: text('property_id'),
  budgetCents: integer('budget_cents').notNull().default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  colorIndex: integer('color_index').notNull().default(3),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const workLots = sqliteTable('work_lots', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  name: text('name').notNull(),
  kind: text('kind', { enum: LOT_KINDS }).notNull().default('other'),
  budgetCents: integer('budget_cents').notNull().default(0),
  /** Taux de TVA × 10 (200, 100, 55). */
  vatRateX10: integer('vat_rate_x10').notNull().default(100),
  startDate: text('start_date'),
  endDate: text('end_date'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const workQuotes = sqliteTable('work_quotes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  lotId: text('lot_id').notNull(),
  contractor: text('contractor').notNull(),
  amountExclVatCents: integer('amount_excl_vat_cents').notNull(),
  vatRateX10: integer('vat_rate_x10').notNull().default(100),
  status: text('status', { enum: QUOTE_STATUSES }).notNull().default('received'),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const workPayments = sqliteTable('work_payments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  lotId: text('lot_id'),
  label: text('label').notNull(),
  kind: text('kind', { enum: WORK_PAYMENT_KINDS }).notNull().default('deposit'),
  amountCents: integer('amount_cents').notNull(),
  dueDate: text('due_date').notNull(),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
});

export type WorkProject = typeof workProjects.$inferSelect;
export type WorkLot = typeof workLots.$inferSelect;
export type WorkQuote = typeof workQuotes.$inferSelect;
export type WorkPayment = typeof workPayments.$inferSelect;
export type LotKind = (typeof LOT_KINDS)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type WorkPaymentKind = (typeof WORK_PAYMENT_KINDS)[number];

/** Règles de catégorisation apprises lors des imports (libellé normalisé → catégorie). */
export const importRules = sqliteTable('import_rules', {
  pattern: text('pattern').primaryKey(),
  categoryId: text('category_id').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export type ImportRule = typeof importRules.$inferSelect;
