/**
 * Utilitaires monétaires.
 *
 * Tous les montants manipulés par les calculs financiers sont des ENTIERS en
 * centimes (type `Cents`). Cela évite les erreurs d'arrondi des nombres
 * flottants (0,1 + 0,2 ≠ 0,3) et garantit que les totaux affichés sont
 * exactement la somme des lignes affichées.
 *
 * Règle d'arrondi : arrondi commercial (« half away from zero ») au centime,
 * comme le font les banques et les simulateurs officiels.
 */

/** Montant en centimes d'euro, toujours entier. */
export type Cents = number;

/** Arrondit un nombre de centimes (potentiellement décimal) à l'entier le plus proche. */
export function roundCents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Montant non fini : ${value}`);
  }
  // Math.round arrondit -0,5 vers 0 ; on veut l'arrondi symétrique.
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(value));
}

/** Convertit un montant en euros (nombre décimal) en centimes entiers. */
export function eurosToCents(euros: number): Cents {
  return roundCents(euros * 100);
}

/** Convertit des centimes en euros (nombre décimal, pour affichage ou calcul). */
export function centsToEuros(cents: Cents): number {
  return cents / 100;
}

/** Parse une saisie utilisateur française ("1 234,56", "1234.56", "12,5") en centimes. */
export function parseEurosInput(input: string): Cents | null {
  const cleaned = input.replace(/\s/g, '').replace(/€/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  if (!/^-?\d*(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return eurosToCents(value);
}

/** Somme sûre d'une liste de montants en centimes. */
export function sumCents(values: readonly Cents[]): Cents {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/**
 * Répartit un montant en N parts entières dont la somme vaut exactement le total.
 * Les centimes restants sont distribués aux premières parts (méthode du plus
 * grand reste), ce qui évite qu'une répartition 50/50 de 0,01 € perde un centime.
 */
export function splitCents(total: Cents, weights: readonly number[]): Cents[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (weightSum <= 0) {
    // Poids nuls : tout à la première part.
    return weights.map((_, i) => (i === 0 ? total : 0));
  }
  const raw = weights.map((w) => (total * w) / weightSum);
  const floors = raw.map((r) => Math.trunc(r));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  // Distribue le reste aux parts dont la partie fractionnaire est la plus grande.
  const order = raw.map((r, i) => ({ i, frac: r - Math.trunc(r) })).sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  const step = remainder > 0 ? 1 : -1;
  let k = 0;
  while (remainder !== 0 && order.length > 0) {
    const idx = order[k % order.length]!.i;
    result[idx] = (result[idx] ?? 0) + step;
    remainder -= step;
    k += 1;
  }
  return result;
}

/** Pourcentage (0–100) d'une part sur un total, arrondi à 1 décimale. 0 si total nul. */
export function percentOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}
