/**
 * Jeu de données de démonstration : un couple (Camille & Hugo), six mois de
 * dépenses réalistes, quelques récurrences et enveloppes. Généré de façon
 * déterministe (graine fixe) pour des captures d'écran reproductibles.
 */
import { subMonths } from 'date-fns';
import { eq } from 'drizzle-orm';

import { toIsoDate } from '@/utils/format';

import { clearDataTables, getDemoDb, type Db } from './client';
import { bumpDataVersion } from './dataVersion';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { ensureDefaultCategories, upsertPerson } from './repositories';
import {
  categories,
  expenses,
  recurringExpenses,
  savingsAccounts,
  savingsGoals,
  savingsMovements,
  propertyScenarios,
  rentalProperties,
  leases,
  rentPayments,
  rentalCharges,
  workProjects,
  workLots,
  workQuotes,
  workPayments,
} from './schema';
import { newId } from '@/utils/id';

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Pattern {
  categoryId: string;
  /** Nombre de dépenses par mois [min, max]. */
  perMonth: [number, number];
  /** Montant en centimes [min, max]. */
  amount: [number, number];
  shared: boolean;
  notes?: string[];
}

const PATTERNS: Pattern[] = [
  {
    categoryId: 'cat_food',
    perMonth: [8, 12],
    amount: [18_00, 95_00],
    shared: true,
    notes: ['Carrefour', 'Biocoop', 'Marché', 'Lidl', 'Boulangerie'],
  },
  {
    categoryId: 'cat_transport',
    perMonth: [3, 5],
    amount: [12_00, 70_00],
    shared: false,
    notes: ['Essence', 'TCL', 'Parking', 'Péage'],
  },
  {
    categoryId: 'cat_leisure',
    perMonth: [2, 4],
    amount: [9_00, 60_00],
    shared: true,
    notes: ['Cinéma', 'Concert', 'Escape game', 'Librairie'],
  },
  {
    categoryId: 'cat_restaurants',
    perMonth: [2, 4],
    amount: [22_00, 85_00],
    shared: true,
    notes: ['Pizzeria', 'Brunch', 'Ramen', 'Bistrot'],
  },
  {
    categoryId: 'cat_health',
    perMonth: [0, 2],
    amount: [8_00, 45_00],
    shared: false,
    notes: ['Pharmacie', 'Ostéo'],
  },
  {
    categoryId: 'cat_clothing',
    perMonth: [0, 2],
    amount: [25_00, 120_00],
    shared: false,
    notes: ['Zara', 'Decathlon'],
  },
  {
    categoryId: 'cat_home',
    perMonth: [0, 2],
    amount: [15_00, 90_00],
    shared: true,
    notes: ['Ikea', 'Leroy Merlin'],
  },
  {
    categoryId: 'cat_gifts',
    perMonth: [0, 1],
    amount: [20_00, 80_00],
    shared: true,
    notes: ['Anniversaire'],
  },
];

export function seedDemo(db: Db = getDemoDb()): void {
  clearDataTables(db);
  ensureDefaultCategories(db);
  const camille = upsertPerson({ name: 'Camille', monthlyIncomeCents: 2_100_00, position: 0 }, db);
  const hugo = upsertPerson({ name: 'Hugo', monthlyIncomeCents: 2_900_00, position: 1 }, db);
  const people = [camille.id, hugo.id];
  const random = rng(20261110);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)]!;
  const between = (min: number, max: number): number => Math.round(min + random() * (max - min));

  const today = new Date();
  db.$client.withTransactionSync(() => {
    // Enveloppes
    const budgets: Record<string, number> = {
      cat_food: 450_00,
      cat_transport: 150_00,
      cat_leisure: 120_00,
      cat_restaurants: 150_00,
      cat_clothing: 80_00,
    };
    for (const [id, budgetCents] of Object.entries(budgets)) {
      db.update(categories).set({ budgetCents }).where(eq(categories.id, id)).run();
    }

    // Six mois de dépenses variables
    for (let m = 5; m >= 0; m -= 1) {
      const monthDate = subMonths(today, m);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const lastDay = m === 0 ? today.getDate() : new Date(year, month + 1, 0).getDate();
      for (const p of PATTERNS) {
        const n = between(p.perMonth[0], p.perMonth[1]);
        for (let i = 0; i < n; i += 1) {
          const day = between(1, lastDay);
          const amount = Math.round(between(p.amount[0], p.amount[1]) / 10) * 10;
          db.insert(expenses)
            .values({
              id: newId('e_'),
              amountCents: amount,
              categoryId: p.categoryId,
              date: toIsoDate(new Date(year, month, day)),
              paidById: pick(people),
              shared: p.shared,
              note: p.notes ? pick(p.notes) : null,
              recurringId: null,
              createdAt: new Date(year, month, day, 12).toISOString(),
            })
            .run();
        }
      }
      // Fixes mensuels (loyer, abonnements, assurance) le 2 du mois
      const fixed: { categoryId: string; amount: number; note: string; paidBy: string }[] = [
        { categoryId: 'cat_housing', amount: 1_150_00, note: 'Loyer', paidBy: hugo.id },
        { categoryId: 'cat_subscriptions', amount: 17_99, note: 'Netflix', paidBy: camille.id },
        { categoryId: 'cat_subscriptions', amount: 29_99, note: 'Box internet', paidBy: hugo.id },
        { categoryId: 'cat_subscriptions', amount: 12_99, note: 'Spotify', paidBy: camille.id },
        { categoryId: 'cat_insurance', amount: 24_50, note: 'Assurance habitation', paidBy: camille.id },
        { categoryId: 'cat_housing', amount: 85_00, note: 'Électricité', paidBy: hugo.id },
      ];
      if (m > 0 || today.getDate() >= 2) {
        for (const f of fixed) {
          db.insert(expenses)
            .values({
              id: newId('e_'),
              amountCents: f.amount,
              categoryId: f.categoryId,
              date: toIsoDate(new Date(year, month, 2)),
              paidById: f.paidBy,
              shared: true,
              note: f.note,
              recurringId: null,
              createdAt: new Date(year, month, 2, 8).toISOString(),
            })
            .run();
        }
      }
    }

    // Récurrences actives pour le mois prochain
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 2);
    const recurring = [
      { categoryId: 'cat_housing', amount: 1_150_00, note: 'Loyer', paidBy: hugo.id },
      { categoryId: 'cat_subscriptions', amount: 17_99, note: 'Netflix', paidBy: camille.id },
      { categoryId: 'cat_subscriptions', amount: 29_99, note: 'Box internet', paidBy: hugo.id },
      { categoryId: 'cat_insurance', amount: 24_50, note: 'Assurance habitation', paidBy: camille.id },
    ];
    for (const r of recurring) {
      db.insert(recurringExpenses)
        .values({
          id: newId('r_'),
          amountCents: r.amount,
          categoryId: r.categoryId,
          paidById: r.paidBy,
          shared: true,
          note: r.note,
          frequency: 'monthly',
          nextDate: toIsoDate(nextMonth),
          active: true,
          createdAt: new Date().toISOString(),
        })
        .run();
    }
  });
  seedDemoSavings(db, today);
  seedDemoProperty(db);
  seedDemoRental(db, today);
  seedDemoWorks(db, today);
  bumpDataVersion();
}

/** Épargne de démo : 4 comptes, 18 mois de mouvements, 2 objectifs. */
function seedDemoSavings(db: Db, today: Date): void {
  const accounts = [
    {
      id: 'sa_demo_livreta',
      name: 'Livret A',
      type: 'livretA' as const,
      rateX100: 170,
      ceilingCents: 22_950_00,
      colorIndex: 2,
      start: 14_000_00,
      monthly: 300_00,
    },
    {
      id: 'sa_demo_ldds',
      name: 'LDDS',
      type: 'ldds' as const,
      rateX100: 170,
      ceilingCents: 12_000_00,
      colorIndex: 5,
      start: 6_500_00,
      monthly: 150_00,
    },
    {
      id: 'sa_demo_av',
      name: 'Assurance-vie Linxea',
      type: 'assuranceVie' as const,
      rateX100: 280,
      ceilingCents: null,
      colorIndex: 0,
      start: 9_000_00,
      monthly: 200_00,
    },
    {
      id: 'sa_demo_pea',
      name: 'PEA',
      type: 'pea' as const,
      rateX100: 650,
      ceilingCents: 150_000_00,
      colorIndex: 6,
      start: 3_000_00,
      monthly: 100_00,
    },
  ];
  db.$client.withTransactionSync(() => {
    accounts.forEach((a, index) => {
      db.insert(savingsAccounts)
        .values({
          id: a.id,
          name: a.name,
          type: a.type,
          rateX100: a.rateX100,
          ceilingCents: a.ceilingCents,
          colorIndex: a.colorIndex,
          position: index,
          archived: false,
          createdAt: new Date().toISOString(),
        })
        .run();
      const first = subMonths(today, 18);
      db.insert(savingsMovements)
        .values({
          id: newId('sm_'),
          accountId: a.id,
          type: 'deposit',
          amountCents: a.start,
          date: toIsoDate(new Date(first.getFullYear(), first.getMonth(), 5)),
          note: 'Solde initial',
          createdAt: new Date().toISOString(),
        })
        .run();
      for (let m = 17; m >= 0; m -= 1) {
        const d = subMonths(today, m);
        if (m === 0 && today.getDate() < 5) continue;
        db.insert(savingsMovements)
          .values({
            id: newId('sm_'),
            accountId: a.id,
            type: 'deposit',
            amountCents: a.monthly,
            date: toIsoDate(new Date(d.getFullYear(), d.getMonth(), 5)),
            note: 'Virement mensuel',
            createdAt: new Date().toISOString(),
          })
          .run();
        if (d.getMonth() === 11 && a.rateX100) {
          db.insert(savingsMovements)
            .values({
              id: newId('sm_'),
              accountId: a.id,
              type: 'interest',
              amountCents: Math.round((a.start + a.monthly * (18 - m)) * (a.rateX100 / 10000)),
              date: toIsoDate(new Date(d.getFullYear(), 11, 31)),
              note: 'Intérêts annuels',
              createdAt: new Date().toISOString(),
            })
            .run();
        }
      }
    });
    const nextYear = new Date(today.getFullYear() + 1, 5, 1);
    db.insert(savingsGoals)
      .values({
        id: 'sg_demo_apport',
        name: 'Apport appartement',
        icon: 'House',
        targetCents: 45_000_00,
        targetDate: toIsoDate(nextYear),
        accountIds: JSON.stringify(['sa_demo_livreta', 'sa_demo_ldds', 'sa_demo_av']),
        colorIndex: 0,
        achievedAt: null,
        createdAt: new Date().toISOString(),
      })
      .run();
    db.insert(savingsGoals)
      .values({
        id: 'sg_demo_japon',
        name: 'Voyage au Japon',
        icon: 'Plane',
        targetCents: 4_000_00,
        targetDate: toIsoDate(new Date(today.getFullYear() + 1, 3, 1)),
        accountIds: JSON.stringify(['sa_demo_pea']),
        colorIndex: 6,
        achievedAt: null,
        createdAt: new Date().toISOString(),
      })
      .run();
  });
}

/** Immobilier de démo : deux scénarios d'achat à comparer. */
function seedDemoProperty(db: Db): void {
  const now = new Date().toISOString();
  const common = {
    condition: 'old' as const,
    increasedDepartment: false,
    insuranceX100: 34,
    applicationFeeCents: 1_000_00,
    guaranteeFeeCents: 2_500_00,
    monthlyNetIncomeCents: 5_000_00,
    monthlyExistingChargesCents: 0,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(propertyScenarios)
    .values({
      id: 'ps_demo_t3',
      name: 'T3 Villeurbanne',
      priceCents: 265_000_00,
      downPaymentCents: 40_000_00,
      rateX100: 340,
      months: 300,
      ...common,
    })
    .run();
  db.insert(propertyScenarios)
    .values({
      id: 'ps_demo_maison',
      name: 'Maison Caluire',
      priceCents: 395_000_00,
      downPaymentCents: 45_000_00,
      rateX100: 350,
      months: 300,
      ...common,
    })
    .run();
}

/** Locatif de démo : deux T2 loués, 12 mois d'échéances, un loyer en retard ce mois-ci, charges déductibles. */
function seedDemoRental(db: Db, today: Date): void {
  const now = new Date().toISOString();
  const props = [
    {
      id: 'rp_demo_lilas',
      name: 'T2 rue des Lilas',
      address: '12 rue des Lilas, 44000 Nantes',
      price: 148_000_00,
      costs: 11_500_00,
      works: 6_000_00,
      tax: 980_00,
      condo: 720_00,
      ins: 140_00,
      loan: 610_00,
      interest: 3_900_00,
      tenant: 'Léa Fournier',
      rent: 640_00,
      charges: 60_00,
      dueDay: 5,
      color: 6,
      lateThisMonth: true,
    },
    {
      id: 'rp_demo_port',
      name: 'T2 quai du Port',
      address: '3 quai du Port, 44100 Nantes',
      price: 162_000_00,
      costs: 12_600_00,
      works: 0,
      tax: 1_050_00,
      condo: 840_00,
      ins: 150_00,
      loan: 0,
      interest: 0,
      tenant: 'Karim Benali',
      rent: 690_00,
      charges: 70_00,
      dueDay: 1,
      color: 0,
      lateThisMonth: false,
    },
  ];
  db.$client.withTransactionSync(() => {
    for (const p of props) {
      db.insert(rentalProperties)
        .values({
          id: p.id,
          name: p.name,
          address: p.address,
          type: 'apartment',
          surfaceM2x10: 420,
          purchasePriceCents: p.price,
          acquisitionCostsCents: p.costs,
          initialWorksCents: p.works,
          annualPropertyTaxCents: p.tax,
          annualCondoCents: p.condo,
          annualInsuranceCents: p.ins,
          annualManagementCents: 0,
          annualOtherCents: 300_00,
          monthlyLoanPaymentCents: p.loan,
          annualLoanInterestCents: p.interest,
          colorIndex: p.color,
          archived: false,
          createdAt: now,
        })
        .run();
      const start = subMonths(today, 14);
      const leaseId = `ls_${p.id}`;
      db.insert(leases)
        .values({
          id: leaseId,
          propertyId: p.id,
          tenantName: p.tenant,
          tenantEmail: null,
          startDate: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 1)),
          endDate: null,
          rentCents: p.rent,
          chargesCents: p.charges,
          depositCents: p.rent,
          dueDay: p.dueDay,
          furnished: false,
          irlIndexX100: 14517,
          createdAt: now,
        })
        .run();
      for (let m = 12; m >= 0; m -= 1) {
        const d = subMonths(today, m);
        const periodKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dueDate = `${periodKey}-${String(p.dueDay).padStart(2, '0')}`;
        const isCurrent = m === 0;
        const paid =
          isCurrent && p.lateThisMonth ? 0 : isCurrent && today.getDate() < p.dueDay ? 0 : p.rent + p.charges;
        db.insert(rentPayments)
          .values({
            id: newId('rpay_'),
            leaseId,
            propertyId: p.id,
            periodKey,
            dueDate,
            rentCents: p.rent,
            chargesCents: p.charges,
            paidCents: paid,
            paidAt: paid > 0 ? `${periodKey}-${String(Math.min(28, p.dueDay + 1)).padStart(2, '0')}` : null,
            createdAt: now,
          })
          .run();
      }
      const year = today.getFullYear();
      db.insert(rentalCharges)
        .values({
          id: newId('rc_'),
          propertyId: p.id,
          date: `${year}-10-15`,
          nature: 'propertyTax',
          amountCents: p.tax,
          note: 'Taxe foncière',
          createdAt: now,
        })
        .run();
      db.insert(rentalCharges)
        .values({
          id: newId('rc_'),
          propertyId: p.id,
          date: `${year}-03-02`,
          nature: 'condo',
          amountCents: Math.round(p.condo / 2),
          note: 'Appel de fonds T1',
          createdAt: now,
        })
        .run();
      db.insert(rentalCharges)
        .values({
          id: newId('rc_'),
          propertyId: p.id,
          date: `${year}-01-10`,
          nature: 'insurance',
          amountCents: p.ins,
          note: 'Assurance PNO',
          createdAt: now,
        })
        .run();
      if (p.interest)
        db.insert(rentalCharges)
          .values({
            id: newId('rc_'),
            propertyId: p.id,
            date: `${year}-01-31`,
            nature: 'interest',
            amountCents: p.interest,
            note: 'Intérêts annuels',
            createdAt: now,
          })
          .run();
    }
  });
}

/** Travaux de démo : rénovation d'une maison, 5 lots, devis comparés, échéancier avec une échéance proche. */
function seedDemoWorks(db: Db, today: Date): void {
  const now = new Date().toISOString();
  const iso = (d: Date): string => toIsoDate(d);
  const shift = (days: number): Date =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  db.$client.withTransactionSync(() => {
    db.insert(workProjects)
      .values({
        id: 'wp_demo',
        name: 'Rénovation maison Caluire',
        propertyId: null,
        budgetCents: 60_000_00,
        startDate: iso(shift(-45)),
        endDate: iso(shift(75)),
        colorIndex: 3,
        archived: false,
        createdAt: now,
      })
      .run();
    const lots = [
      {
        id: 'wl_plomb',
        name: 'Plomberie',
        kind: 'plumbing' as const,
        budget: 9_000_00,
        vat: 100,
        start: -45,
        end: -20,
        done: true,
        quotes: [
          ['Plomberie Martin', 7_900_00, 'accepted'],
          ['AquaServices', 9_400_00, 'rejected'],
        ],
      },
      {
        id: 'wl_elec',
        name: 'Électricité',
        kind: 'electricity' as const,
        budget: 11_000_00,
        vat: 100,
        start: -30,
        end: 5,
        done: false,
        quotes: [
          ['Élec 69', 10_200_00, 'accepted'],
          ['Lumitech', 12_600_00, 'rejected'],
        ],
      },
      {
        id: 'wl_cuisine',
        name: 'Cuisine',
        kind: 'kitchen' as const,
        budget: 14_000_00,
        vat: 100,
        start: 0,
        end: 30,
        done: false,
        quotes: [['Cuisines Rhône', 15_800_00, 'accepted']],
      },
      {
        id: 'wl_sdb',
        name: 'Salle de bain',
        kind: 'bathroom' as const,
        budget: 12_000_00,
        vat: 100,
        start: 15,
        end: 45,
        done: false,
        quotes: [
          ['Bati Déco', 11_300_00, 'received'],
          ['Rénov Plus', 10_900_00, 'received'],
        ],
      },
      {
        id: 'wl_iso',
        name: 'Isolation combles',
        kind: 'insulation' as const,
        budget: 8_000_00,
        vat: 55,
        start: 45,
        end: 70,
        done: false,
        quotes: [["Isol'Habitat", 7_600_00, 'received']],
      },
    ];
    lots.forEach((l, position) => {
      db.insert(workLots)
        .values({
          id: l.id,
          projectId: 'wp_demo',
          name: l.name,
          kind: l.kind,
          budgetCents: l.budget,
          vatRateX10: l.vat,
          startDate: iso(shift(l.start)),
          endDate: iso(shift(l.end)),
          done: l.done,
          position,
          createdAt: now,
        })
        .run();
      for (const [contractor, amount, status] of l.quotes) {
        db.insert(workQuotes)
          .values({
            id: newId('wq_'),
            projectId: 'wp_demo',
            lotId: l.id,
            contractor: contractor as string,
            amountExclVatCents: amount as number,
            vatRateX10: l.vat,
            status: status as 'received' | 'accepted' | 'rejected',
            date: iso(shift(l.start - 20)),
            note: null,
            createdAt: now,
          })
          .run();
      }
    });
    const payments: [
      string,
      string,
      'deposit' | 'progress' | 'balance' | 'other',
      number,
      number,
      boolean,
    ][] = [
      ['wl_plomb', 'Acompte plomberie', 'deposit', 2_607_00, -50, true],
      ['wl_plomb', 'Solde plomberie', 'balance', 6_083_00, -18, true],
      ['wl_elec', 'Acompte électricité', 'deposit', 3_366_00, -35, true],
      ['wl_elec', 'Solde électricité', 'balance', 7_854_00, 4, false],
      ['wl_cuisine', 'Acompte cuisine', 'deposit', 5_214_00, -2, false],
      ['wl_cuisine', 'Solde cuisine', 'balance', 12_166_00, 32, false],
    ];
    for (const [lotId, label, kind, amount, day, paid] of payments) {
      db.insert(workPayments)
        .values({
          id: newId('wpay_'),
          projectId: 'wp_demo',
          lotId,
          label,
          kind,
          amountCents: amount,
          dueDate: iso(shift(day)),
          paidAt: paid ? iso(shift(day)) : null,
          createdAt: now,
        })
        .run();
    }
  });
}

/** Les catégories de démo sont les catégories par défaut. */
export const DEMO_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);
