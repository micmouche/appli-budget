import { initI18n } from '@/i18n';
import { formatCents, formatMonthKey, formatPct, fromIsoDate, toIsoDate } from './format';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'fr' }] }));

beforeAll(() => {
  initI18n('fr');
});

describe('format', () => {
  test('formatCents fr-FR', () => {
    expect(formatCents(1159_92).replace(/ | /g, ' ')).toBe('1 159,92 €');
    expect(formatCents(-50_00)).toMatch(/^−/);
    expect(formatCents(50_00, { signed: true })).toMatch(/^\+/);
    expect(formatCents(1_200_00, { compact: true }).replace(/ | /g, ' ')).toBe('1 200 €');
  });

  test('formatPct', () => {
    expect(formatPct(35)).toBe('35 %');
    expect(formatPct(12.345)).toBe('12,3 %');
  });

  test('dates ISO', () => {
    expect(toIsoDate(new Date(2026, 10, 5))).toBe('2026-11-05');
    expect(fromIsoDate('2026-11-05')).toEqual(new Date(2026, 10, 5));
  });

  test('formatMonthKey', () => {
    expect(formatMonthKey('2026-11')).toBe('Novembre 2026');
  });
});
