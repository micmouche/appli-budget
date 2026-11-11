/** Logique pure du module Épargne (testée sans base de données). */
import { monthlyContributionForGoal, monthsToReachGoal } from '@/finance/compound';
import type { Cents } from '@/finance/money';
import { REGULATED_SAVINGS } from '@/finance/constants.fr';
import type { MovementType, SavingsType } from '@/db/schema';

export interface MovementLike {
  accountId: string;
  type: MovementType;
  amountCents: Cents;
  date: string;
}

/** Signe d'un mouvement sur le solde. */
export function movementSign(type: MovementType): 1 | -1 {
  return type === 'withdrawal' ? -1 : 1;
}

/** Solde d'un compte à partir de ses mouvements (optionnellement jusqu'à une date incluse). */
export function balanceOf(movements: readonly MovementLike[], accountId: string, untilDate?: string): Cents {
  let total = 0;
  for (const m of movements) {
    if (m.accountId !== accountId) continue;
    if (untilDate && m.date > untilDate) continue;
    total += movementSign(m.type) * m.amountCents;
  }
  return total;
}

/** Cumul des versements (hors intérêts, hors retraits) : assiette pour le plafond réglementaire. */
export function depositsOf(movements: readonly MovementLike[], accountId: string): Cents {
  let deposits = 0;
  let withdrawals = 0;
  for (const m of movements) {
    if (m.accountId !== accountId) continue;
    if (m.type === 'deposit') deposits += m.amountCents;
    if (m.type === 'withdrawal') withdrawals += m.amountCents;
  }
  // Le plafond s'apprécie sur le capital versé net des retraits (les intérêts peuvent le dépasser).
  return Math.max(0, deposits - withdrawals);
}

export interface CeilingStatus {
  ceilingCents: Cents;
  usedCents: Cents;
  remainingCents: Cents;
  usedPct: number;
  level: 'ok' | 'near' | 'reached';
}

export function ceilingStatus(ceilingCents: Cents | null, depositsCents: Cents): CeilingStatus | null {
  if (!ceilingCents || ceilingCents <= 0) return null;
  const usedPct = Math.round((depositsCents / ceilingCents) * 1000) / 10;
  const level: CeilingStatus['level'] =
    depositsCents >= ceilingCents ? 'reached' : usedPct >= 90 ? 'near' : 'ok';
  return {
    ceilingCents,
    usedCents: depositsCents,
    remainingCents: Math.max(0, ceilingCents - depositsCents),
    usedPct,
    level,
  };
}

/** Série mensuelle de l'encours total (fin de mois) sur N mois, du plus ancien au plus récent. */
export function monthlySeries(
  movements: readonly MovementLike[],
  months: number,
  now = new Date(),
): { monthKey: string; totalCents: Cents }[] {
  const result: { monthKey: string; totalCents: Cents }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // dernier jour du mois
    const until = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let total = 0;
    for (const m of movements) {
      if (m.date <= until) total += movementSign(m.type) * m.amountCents;
    }
    result.push({ monthKey: until.slice(0, 7), totalCents: total });
  }
  return result;
}

export interface GoalProjection {
  currentCents: Cents;
  targetCents: Cents;
  progressPct: number;
  reached: boolean;
  monthsLeft: number | null;
  /** Versement mensuel conseillé pour tenir la date cible (null sans date ou déjà atteint). */
  suggestedMonthlyCents: Cents | null;
  /** Nombre de mois au rythme moyen observé (null si rythme nul ou inatteignable). */
  monthsAtCurrentPace: number | null;
}

/**
 * Projection d'un objectif : versement conseillé pour la date cible et date d'atteinte au rythme
 * moyen des 3 derniers mois (versements nets), à taux annuel supposé.
 */
export function projectGoal(input: {
  currentCents: Cents;
  targetCents: Cents;
  targetDate: string | null;
  averageMonthlyNetCents: Cents;
  annualRatePct: number;
  now?: Date;
}): GoalProjection {
  const now = input.now ?? new Date();
  const reached = input.currentCents >= input.targetCents;
  const progressPct =
    input.targetCents <= 0
      ? 100
      : Math.min(999, Math.round((input.currentCents / input.targetCents) * 1000) / 10);
  let monthsLeft: number | null = null;
  if (input.targetDate) {
    const [y, m] = input.targetDate.split('-').map(Number);
    monthsLeft = Math.max(0, ((y ?? 0) - now.getFullYear()) * 12 + ((m ?? 1) - 1 - now.getMonth()));
  }
  const suggestedMonthlyCents =
    reached || monthsLeft === null
      ? null
      : monthlyContributionForGoal(input.targetCents, input.currentCents, input.annualRatePct, monthsLeft);
  const monthsAtCurrentPace = reached
    ? 0
    : input.averageMonthlyNetCents <= 0
      ? null
      : monthsToReachGoal(
          input.targetCents,
          input.currentCents,
          input.averageMonthlyNetCents,
          input.annualRatePct,
        );
  return {
    currentCents: input.currentCents,
    targetCents: input.targetCents,
    progressPct,
    reached,
    monthsLeft,
    suggestedMonthlyCents,
    monthsAtCurrentPace,
  };
}

/** Moyenne des versements nets (versements − retraits) des 3 derniers mois civils. */
export function averageMonthlyNet(
  movements: readonly MovementLike[],
  accountIds: readonly string[] | null,
  now = new Date(),
): Cents {
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const startIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
  let net = 0;
  for (const m of movements) {
    if (accountIds && accountIds.length > 0 && !accountIds.includes(m.accountId)) continue;
    if (m.date < startIso || m.type === 'interest') continue;
    net += movementSign(m.type) * m.amountCents;
  }
  return Math.round(net / 3);
}

/** Valeurs par défaut (taux, plafond) selon le type de compte. */
export function defaultsForType(type: SavingsType): {
  rateX100: number | null;
  ceilingCents: Cents | null;
  icon: string;
} {
  switch (type) {
    case 'livretA':
      return {
        rateX100: Math.round(REGULATED_SAVINGS.livretA.ratePct * 100),
        ceilingCents: REGULATED_SAVINGS.livretA.ceilingCents,
        icon: 'PiggyBank',
      };
    case 'ldds':
      return {
        rateX100: Math.round(REGULATED_SAVINGS.ldds.ratePct * 100),
        ceilingCents: REGULATED_SAVINGS.ldds.ceilingCents,
        icon: 'Leaf',
      };
    case 'lep':
      return {
        rateX100: Math.round(REGULATED_SAVINGS.lep.ratePct * 100),
        ceilingCents: REGULATED_SAVINGS.lep.ceilingCents,
        icon: 'HandCoins',
      };
    case 'pel':
      return {
        rateX100: Math.round(REGULATED_SAVINGS.pel.ratePct * 100),
        ceilingCents: REGULATED_SAVINGS.pel.ceilingCents,
        icon: 'House',
      };
    case 'cel':
      return {
        rateX100: Math.round(REGULATED_SAVINGS.cel.ratePct * 100),
        ceilingCents: REGULATED_SAVINGS.cel.ceilingCents,
        icon: 'House',
      };
    case 'livret':
      return { rateX100: 200, ceilingCents: null, icon: 'Landmark' };
    case 'assuranceVie':
      return { rateX100: 250, ceilingCents: null, icon: 'Shield' };
    case 'pea':
      return { rateX100: 600, ceilingCents: 150_000_00, icon: 'TrendingUp' };
    case 'cto':
      return { rateX100: 600, ceilingCents: null, icon: 'ChartLine' };
    case 'crypto':
      return { rateX100: null, ceilingCents: null, icon: 'Bitcoin' };
    case 'cash':
      return { rateX100: 0, ceilingCents: null, icon: 'Wallet' };
    case 'other':
      return { rateX100: null, ceilingCents: null, icon: 'Coins' };
  }
}
