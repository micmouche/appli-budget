/**
 * Constantes réglementaires françaises utilisées par les simulateurs.
 *
 * IMPORTANT : ces valeurs évoluent (arrêtés, lois de finances). Chaque bloc porte
 * sa date de validité. L'utilisateur peut les surcharger dans l'app, et elles
 * peuvent être mises à jour via EAS Update sans resoumission aux stores.
 * Toutes les simulations qui les utilisent affichent la mention
 * « Simulation indicative, ne constitue pas un conseil financier ».
 */

export const CONSTANTS_VALIDITY = '2026-11-10';

/** Règle HCSF (Haut Conseil de stabilité financière) : taux d'endettement maximal. */
export const HCSF = {
  /** Taux d'effort maximal, en % des revenus nets (assurance emprunteur comprise). */
  maxDebtRatioPct: 35,
  /** Durée maximale d'un crédit immobilier en années (27 ans avec différé pour le neuf / travaux). */
  maxLoanYears: 25,
} as const;

/** Livrets réglementés : taux annuels et plafonds de versement (hors intérêts capitalisés). */
export const REGULATED_SAVINGS = {
  livretA: { ratePct: 1.7, ceilingCents: 22_950_00, label: 'Livret A' },
  ldds: { ratePct: 1.7, ceilingCents: 12_000_00, label: 'LDDS' },
  lep: { ratePct: 2.7, ceilingCents: 10_000_00, label: 'LEP' },
  pel: { ratePct: 1.75, ceilingCents: 61_200_00, label: 'PEL' },
  cel: { ratePct: 1.25, ceilingCents: 15_300_00, label: 'CEL' },
} as const;

/** Prélèvement forfaitaire unique (« flat tax ») sur les revenus du capital. */
export const PFU_PCT = 30;

/**
 * Émoluments du notaire (barème proportionnel dégressif, arrêté du 28 février 2020,
 * reconduit). Les tranches sont exprimées en euros TTC du prix d'achat ; le taux
 * s'applique hors taxes, puis TVA 20 %.
 */
export const NOTARY_FEE_BRACKETS = [
  { upToCents: 6_500_00, ratePct: 3.87 },
  { upToCents: 17_000_00, ratePct: 1.596 },
  { upToCents: 60_000_00, ratePct: 1.064 },
  { upToCents: Number.POSITIVE_INFINITY, ratePct: 0.799 },
] as const;

export const VAT_PCT = 20;

/**
 * Droits de mutation à titre onéreux (DMTO) pour un logement ANCIEN.
 * - Part départementale : 4,50 % dans la quasi-totalité des départements (certains
 *   ont voté une hausse temporaire à 5,00 % autorisée par la loi de finances 2025).
 * - Taxe communale additionnelle : 1,20 %.
 * - Prélèvement pour frais d'assiette de l'État : 2,37 % de la part départementale.
 */
export const TRANSFER_TAX_OLD = {
  departmentPct: 4.5,
  departmentPctIncreased: 5.0,
  communePct: 1.2,
  stateLevyPctOfDepartment: 2.37,
} as const;

/** Logement NEUF (VEFA) : taxe de publicité foncière réduite. */
export const TRANSFER_TAX_NEW_PCT = 0.715;

/** Contribution de sécurité immobilière (ex-salaire du conservateur). */
export const SECURITY_CONTRIBUTION_PCT = 0.1;

/** Débours et formalités : estimation forfaitaire (variable selon le dossier). */
export const NOTARY_DISBURSEMENTS_CENTS = 1_200_00;

/** Taux de TVA applicables aux travaux. */
export const WORKS_VAT = {
  standardPct: 20,
  renovationPct: 10,
  energyRenovationPct: 5.5,
} as const;

/** Abattement du régime micro-foncier. */
export const MICRO_FONCIER = {
  abatementPct: 30,
  ceilingCents: 15_000_00,
} as const;

/** Prélèvements sociaux sur les revenus fonciers. */
export const SOCIAL_LEVIES_PCT = 17.2;
