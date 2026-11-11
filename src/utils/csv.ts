/**
 * Génération CSV compatible Excel français : séparateur « ; », BOM UTF-8,
 * valeurs entre guillemets si nécessaire, décimales avec virgule.
 */
import type { Cents } from '@/finance/money';

export const CSV_BOM = '﻿';

export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[";\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** « 1234,56 » (sans symbole, pour que Excel lise un nombre). */
export function csvCents(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const euros = Math.trunc(abs / 100);
  const c = abs % 100;
  return `${sign}${euros},${c < 10 ? '0' : ''}${c}`;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (string | number | null | undefined)[][],
): string {
  const lines = [headers.map(csvEscape).join(';'), ...rows.map((r) => r.map(csvEscape).join(';'))];
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}
