import { applyKey } from './numpadLogic';

describe('NumPad.applyKey', () => {
  test('construit un montant', () => {
    let v = '';
    for (const k of ['4', '2', ',', '3']) v = applyKey(v, k);
    expect(v).toBe('42,3');
    expect(applyKey(v, '0')).toBe('42,30');
    expect(applyKey('42,30', '5')).toBe('42,30'); // 2 décimales max
  });
  test('virgule et zéro initial', () => {
    expect(applyKey('', ',')).toBe('0,');
    expect(applyKey('0', '7')).toBe('7');
    expect(applyKey('12,', ',')).toBe('12,');
  });
  test('effacer', () => {
    expect(applyKey('12,5', 'back')).toBe('12,');
    expect(applyKey('', 'back')).toBe('');
  });
  test('limite de chiffres entiers', () => {
    expect(applyKey('1234567', '8')).toBe('1234567');
  });
});
