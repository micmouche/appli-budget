/**
 * Formatage monnaie / dates / pourcentages, locale fr-FR par défaut.
 * Hermes embarque Intl : pas de polyfill nécessaire.
 */
import { format as dfFormat, isToday, isYesterday } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import i18n from '@/i18n';

import type { Cents } from '@/finance/money';

function currentLocale(): string {
  return i18n.language === 'en' ? 'en-GB' : 'fr-FR';
}

function dateLocale() {
  return i18n.language === 'en' ? enUS : fr;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(locale: string, currency: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}|${currency}|${fractionDigits}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatterCache.set(key, f);
  }
  return f;
}

/** « 1 159,92 € ». Le signe moins est le vrai signe moins (U+2212). */
export function formatCents(
  cents: Cents,
  options: { currency?: string; compact?: boolean; signed?: boolean } = {},
): string {
  const currency = options.currency ?? 'EUR';
  const digits = options.compact && Math.abs(cents) >= 1_000_00 && cents % 100 === 0 ? 0 : 2;
  const text = currencyFormatter(currentLocale(), currency, digits).format(Math.abs(cents) / 100);
  if (cents < 0) return `−${text}`;
  if (options.signed && cents > 0) return `+${text}`;
  return text;
}

/** « 12,5 % » */
export function formatPct(value: number, digits = 1): string {
  return `${new Intl.NumberFormat(currentLocale(), { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(value)} %`;
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: digits }).format(value);
}

/** « 27 nov. 2026 » */
export function formatDate(date: Date | string, pattern = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dfFormat(d, pattern, { locale: dateLocale() });
}

/** « Aujourd'hui », « Hier », sinon « mar. 27 nov. » */
export function formatRelativeDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return i18n.t('common.today');
  if (isYesterday(d)) return i18n.t('common.yesterday');
  return dfFormat(d, 'EEE d MMM', { locale: dateLocale() });
}

/** « Novembre 2026 » */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y ?? 2000, (m ?? 1) - 1, 1);
  const text = dfFormat(d, 'LLLL yyyy', { locale: dateLocale() });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « nov. » */
export function formatMonthShort(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y ?? 2000, (m ?? 1) - 1, 1);
  return dfFormat(d, 'LLL', { locale: dateLocale() }).replace('.', '');
}

/** Date ISO « AAAA-MM-JJ » en heure locale. */
export function toIsoDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${date.getFullYear()}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Montant lu par VoiceOver : « quarante-deux euros trente ». */
export function centsAccessibilityLabel(cents: Cents): string {
  const euros = Math.trunc(Math.abs(cents) / 100);
  const c = Math.abs(cents) % 100;
  const sign = cents < 0 ? (i18n.language === 'en' ? 'minus ' : 'moins ') : '';
  const unit = i18n.language === 'en' ? 'euros' : 'euros';
  return c === 0 ? `${sign}${euros} ${unit}` : `${sign}${euros} ${unit} ${c}`;
}
