import { csvCents, csvEscape, toCsv, CSV_BOM } from './csv';

describe('csv', () => {
  test('csvCents', () => {
    expect(csvCents(1234_56)).toBe('1234,56');
    expect(csvCents(-5)).toBe('-0,05');
    expect(csvCents(0)).toBe('0,00');
  });
  test('csvEscape', () => {
    expect(csvEscape('abc')).toBe('abc');
    expect(csvEscape('a;b')).toBe('"a;b"');
    expect(csvEscape('dit "oui"')).toBe('"dit ""oui"""');
    expect(csvEscape(null)).toBe('');
  });
  test('toCsv', () => {
    const csv = toCsv(
      ['A', 'B'],
      [
        ['x', 1],
        ['y;z', 2],
      ],
    );
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv).toContain('A;B\r\nx;1\r\n"y;z";2\r\n');
  });
});
