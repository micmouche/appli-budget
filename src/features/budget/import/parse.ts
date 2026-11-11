/**
 * Lecture de relevés bancaires : CSV (formats des banques françaises) et OFX.
 * Sortie normalisée : date ISO, libellé, montant signé en centimes (négatif = débit).
 * Pur TypeScript, testé.
 */
import type { Cents } from '@/finance/money';

export interface BankTransaction {
  date: string;
  label: string;
  amountCents: Cents;
  /** Empreinte stable (date + montant + libellé normalisé) pour éviter les doublons. */
  key: string;
}

export function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\b(CB|CARTE|PAIEMENT|PRLV|PRELEVEMENT|VIR|VIREMENT|SEPA|FACTURE|DU|LE)\b/g, ' ')
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, ' ')
    .replace(/[^A-Z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function transactionKey(date: string, amountCents: Cents, label: string): string {
  const norm = normalizeLabel(label).slice(0, 40);
  let h = 0;
  const src = `${date}|${amountCents}|${norm}`;
  for (let i = 0; i < src.length; i += 1) h = (Math.imul(h, 31) + src.charCodeAt(i)) | 0;
  return `${date}:${amountCents}:${(h >>> 0).toString(36)}`;
}

/** « 1 234,56 », « -12.30 », « 12,30 € », « (12,30) » → centimes. */
export function parseAmount(raw: string): Cents | null {
  let s = raw.replace(/ | |\s/g, '').replace(/€|EUR/gi, '');
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) s = s.slice(1);
  if (s === '') return null;
  // Dernier séparateur = décimal ; les autres = milliers.
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const dec = Math.max(lastComma, lastDot);
  let intPart = s;
  let fracPart = '';
  if (dec >= 0 && s.length - dec - 1 <= 2) {
    intPart = s.slice(0, dec);
    fracPart = s.slice(dec + 1);
  }
  intPart = intPart.replace(/[.,]/g, '');
  if (!/^\d*$/.test(intPart) || !/^\d{0,2}$/.test(fracPart)) return null;
  if (intPart === '' && fracPart === '') return null;
  const cents = Number(intPart || '0') * 100 + Number((fracPart + '00').slice(0, 2));
  return negative ? -cents : cents;
}

/** « 05/11/2026 », « 2026-11-05 », « 05.11.26 », « 20261105 » → ISO. */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
    return `${y}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  }
  m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (c === sep && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

const DATE_HEADERS = [
  'date',
  'date operation',
  "date d'operation",
  'date de l operation',
  'date valeur',
  'dateop',
  'transaction date',
  'date transaction',
];
const LABEL_HEADERS = [
  'libelle',
  'libellé',
  'label',
  'description',
  'intitule',
  'intitulé',
  'operation',
  'opération',
  'nom',
  'details',
  'détails',
  'memo',
];
const AMOUNT_HEADERS = ['montant', 'amount', 'montant eur', 'montant(eur)', 'montant (eur)', 'somme'];
const DEBIT_HEADERS = ['debit', 'débit', 'montant debit', 'sortie'];
const CREDIT_HEADERS = ['credit', 'crédit', 'montant credit', 'entree', 'entrée'];

function findCol(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => normalizeHeader(h));
  for (const c of candidates) {
    const idx = norm.findIndex((h) => h === normalizeHeader(c));
    if (idx >= 0) return idx;
  }
  for (const c of candidates) {
    const idx = norm.findIndex((h) => h.includes(normalizeHeader(c)));
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeHeader(h: string): string {
  return h.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/"/g, '').trim();
}

export function parseCsv(text: string): BankTransaction[] {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  // Certaines banques ajoutent des lignes d'en-tête (solde, compte) avant le tableau : on cherche la ligne d'en-têtes.
  let headerIndex = -1;
  let sep = ';';
  for (let i = 0; i < Math.min(lines.length, 15); i += 1) {
    for (const candidate of [';', ',', '\t']) {
      const cols = splitCsvLine(lines[i]!, candidate);
      if (
        cols.length >= 3 &&
        findCol(cols, DATE_HEADERS) >= 0 &&
        (findCol(cols, AMOUNT_HEADERS) >= 0 || findCol(cols, DEBIT_HEADERS) >= 0)
      ) {
        headerIndex = i;
        sep = candidate;
        break;
      }
    }
    if (headerIndex >= 0) break;
  }
  if (headerIndex < 0) return parseCsvHeadless(lines);
  const headers = splitCsvLine(lines[headerIndex]!, sep);
  const dateCol = findCol(headers, DATE_HEADERS);
  const labelCol = findCol(headers, LABEL_HEADERS);
  const amountCol = findCol(headers, AMOUNT_HEADERS);
  const debitCol = findCol(headers, DEBIT_HEADERS);
  const creditCol = findCol(headers, CREDIT_HEADERS);
  const result: BankTransaction[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const cols = splitCsvLine(line, sep);
    const date = parseDate(cols[dateCol] ?? '');
    if (!date) continue;
    let amount: Cents | null = null;
    if (amountCol >= 0 && cols[amountCol]) amount = parseAmount(cols[amountCol]!);
    if (amount === null && debitCol >= 0) {
      const d = cols[debitCol] ? parseAmount(cols[debitCol]!) : null;
      const c = creditCol >= 0 && cols[creditCol] ? parseAmount(cols[creditCol]!) : null;
      if (d !== null && d !== 0) amount = -Math.abs(d);
      else if (c !== null && c !== 0) amount = Math.abs(c);
    }
    if (amount === null) continue;
    const label =
      (labelCol >= 0
        ? cols[labelCol]
        : cols.find((c, i) => i !== dateCol && i !== amountCol && /[a-zA-Z]{3}/.test(c))) ?? '';
    result.push({
      date,
      label: label.replace(/\s+/g, ' ').trim(),
      amountCents: amount,
      key: transactionKey(date, amount, label),
    });
  }
  return result;
}

/** CSV sans en-tête reconnue : on cherche sur chaque ligne une date, un montant et un texte. */
function parseCsvHeadless(lines: string[]): BankTransaction[] {
  const result: BankTransaction[] = [];
  for (const line of lines) {
    const sep = [';', ',', '\t'].sort((a, b) => line.split(b).length - line.split(a).length)[0]!;
    const cols = splitCsvLine(line, sep);
    const dateIdx = cols.findIndex((c) => parseDate(c) !== null);
    if (dateIdx < 0) continue;
    const amountIdx = cols.findIndex(
      (c, i) => i !== dateIdx && /\d/.test(c) && parseAmount(c) !== null && !/[a-zA-Z]{3}/.test(c),
    );
    if (amountIdx < 0) continue;
    const label = cols.find((c, i) => i !== dateIdx && i !== amountIdx && /[a-zA-Z]{3}/.test(c)) ?? '';
    const date = parseDate(cols[dateIdx]!)!;
    const amount = parseAmount(cols[amountIdx]!)!;
    result.push({ date, label: label.trim(), amountCents: amount, key: transactionKey(date, amount, label) });
  }
  return result;
}

export function parseOfx(text: string): BankTransaction[] {
  const result: BankTransaction[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  for (const block of blocks) {
    const body = block.split(/<\/STMTTRN>/i)[0] ?? block;
    const get = (tag: string): string | null => {
      const m = body.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i'));
      return m ? m[1]!.trim() : null;
    };
    const dt = get('DTPOSTED') ?? get('DTUSER');
    const amt = get('TRNAMT');
    if (!dt || !amt) continue;
    const date = parseDate(dt);
    const amount = parseAmount(amt);
    if (!date || amount === null) continue;
    const label = [get('NAME'), get('MEMO')].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    result.push({ date, label, amountCents: amount, key: transactionKey(date, amount, label) });
  }
  return result;
}

/** Détecte le format et lit le fichier. */
export function parseStatement(text: string): BankTransaction[] {
  if (/<OFX>|<STMTTRN>|OFXHEADER/i.test(text)) return parseOfx(text);
  return parseCsv(text);
}
