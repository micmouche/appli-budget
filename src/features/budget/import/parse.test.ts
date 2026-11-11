import { categorize, learningKey } from './categorize';
import { parseAmount, parseCsv, parseDate, parseOfx, parseStatement } from './parse';

describe('import — montants et dates', () => {
  test('parseAmount', () => {
    expect(parseAmount('-12,30')).toBe(-1230);
    expect(parseAmount('1 234,56')).toBe(123456);
    expect(parseAmount('1.234,56')).toBe(123456);
    expect(parseAmount('1,234.56')).toBe(123456);
    expect(parseAmount('42')).toBe(4200);
    expect(parseAmount('(15,00)')).toBe(-1500);
    expect(parseAmount('12,30 €')).toBe(1230);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
  test('parseDate', () => {
    expect(parseDate('05/11/2026')).toBe('2026-11-05');
    expect(parseDate('5/11/26')).toBe('2026-11-05');
    expect(parseDate('2026-11-05')).toBe('2026-11-05');
    expect(parseDate('20261105120000')).toBe('2026-11-05');
    expect(parseDate('hier')).toBeNull();
  });
});

describe('import — CSV', () => {
  test('format Crédit Agricole / Banque Populaire (Date;Libellé;Débit;Crédit)', () => {
    const csv =
      'Date;Libellé;Débit euros;Crédit euros\n05/11/2026;"CARTE 04/11 CARREFOUR MARKET";42,30;\n06/11/2026;VIR SEPA SALAIRE;;2 100,00\n';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: '2026-11-05', amountCents: -4230 });
    expect(rows[1]).toMatchObject({ date: '2026-11-06', amountCents: 210000 });
  });
  test('format Boursorama / BNP (lignes de solde avant, séparateur ;, montant signé)', () => {
    const csv =
      'Compte;12345\nSolde;1 000,00\n\ndateOp;dateVal;label;category;amount\n2026-11-05;2026-11-05;"Netflix.com";Abonnements;-17,99\n';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ date: '2026-11-05', label: 'Netflix.com', amountCents: -1799 });
  });
  test('CSV sans en-tête', () => {
    const rows = parseCsv('05/11/2026,SNCF VOYAGEURS,-56.00\n06/11/2026,LIDL,-23.45\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]!.label).toBe('LIDL');
  });
  test('clé anti-doublon stable', () => {
    const a = parseCsv('Date;Libelle;Montant\n05/11/2026;LIDL;-23,45\n')[0]!;
    const b = parseCsv('Date;Libelle;Montant\n05/11/2026;lidl;-23,45\n')[0]!;
    expect(a.key).toBe(b.key);
  });
});

describe('import — OFX', () => {
  test('bloc STMTTRN', () => {
    const ofx =
      'OFXHEADER:100\n<OFX><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261105<TRNAMT>-42.30<FITID>1<NAME>CARREFOUR MARKET</STMTTRN><STMTTRN><DTPOSTED>20261106<TRNAMT>2100.00<NAME>SALAIRE<MEMO>VIR</STMTTRN></OFX>';
    const rows = parseStatement(ofx);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: '2026-11-05', amountCents: -4230, label: 'CARREFOUR MARKET' });
    expect(parseOfx('rien')).toEqual([]);
  });
});

describe('import — catégorisation', () => {
  const learned = new Map<string, string>([['BOULANGERIE PAUL', 'cat_food']]);
  test('mots-clés', () => {
    expect(
      categorize({ label: 'CARTE 04/11 CARREFOUR MARKET LYON', learned, fallback: 'cat_other' }).categoryId,
    ).toBe('cat_food');
    expect(categorize({ label: 'PRLV SEPA NETFLIX.COM', learned, fallback: 'cat_other' }).categoryId).toBe(
      'cat_subscriptions',
    );
    expect(categorize({ label: 'SNCF VOYAGEURS', learned, fallback: 'cat_other' }).categoryId).toBe(
      'cat_transport',
    );
    expect(categorize({ label: 'PHARMACIE DU CENTRE', learned, fallback: 'cat_other' }).categoryId).toBe(
      'cat_health',
    );
  });
  test('règle apprise prioritaire, repli sinon', () => {
    expect(
      categorize({ label: 'CB BOULANGERIE PAUL PART DIEU', learned, fallback: 'cat_other' }).source,
    ).toBe('learned');
    expect(categorize({ label: 'XYZ INCONNU', learned, fallback: 'cat_other' })).toEqual({
      categoryId: 'cat_other',
      source: 'fallback',
    });
    expect(learningKey('CARTE 04/11 CARREFOUR MARKET LYON PART DIEU')).toBe('CARREFOUR MARKET LYON');
  });
});
