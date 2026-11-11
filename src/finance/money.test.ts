import { eurosToCents, parseEurosInput, percentOf, roundCents, splitCents, sumCents } from './money';

describe('money', () => {
  test('roundCents arrondit symétriquement au centime', () => {
    expect(roundCents(10.4)).toBe(10);
    expect(roundCents(10.5)).toBe(11);
    expect(roundCents(-10.5)).toBe(-11);
    expect(roundCents(0.49999)).toBe(0);
  });

  test('eurosToCents évite les erreurs flottantes classiques', () => {
    expect(eurosToCents(0.1 + 0.2)).toBe(30);
    expect(eurosToCents(1159.92)).toBe(115992);
    expect(eurosToCents(19.99)).toBe(1999);
  });

  test('parseEurosInput accepte les saisies françaises', () => {
    expect(parseEurosInput('42,30')).toBe(4230);
    expect(parseEurosInput('1 234,5')).toBe(123450);
    expect(parseEurosInput('1234.56 €')).toBe(123456);
    expect(parseEurosInput('')).toBeNull();
    expect(parseEurosInput('abc')).toBeNull();
    expect(parseEurosInput('12,345')).toBeNull(); // 3 décimales refusées
  });

  test('splitCents conserve exactement le total', () => {
    expect(splitCents(1, [1, 1])).toEqual([1, 0]);
    expect(splitCents(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(splitCents(1000, [2100, 2900])).toEqual([420, 580]);
    const parts = splitCents(99_999, [3, 7, 11]);
    expect(sumCents(parts)).toBe(99_999);
    expect(splitCents(500, [0, 0])).toEqual([500, 0]);
  });

  test('percentOf', () => {
    expect(percentOf(25, 100)).toBe(25);
    expect(percentOf(1, 3)).toBe(33.3);
    expect(percentOf(5, 0)).toBe(0);
  });
});
