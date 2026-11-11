import { estimateNotaryFees, notaryFeesExclVat, oldTransferTaxRatePct } from './notary';

describe('notary', () => {
  test('barème des émoluments par tranches pour 250 000 €', () => {
    // 6 500 × 3,870 % + 10 500 × 1,596 % + 43 000 × 1,064 % + 190 000 × 0,799 % = 2 394,75
    expect(notaryFeesExclVat(250_000_00)).toBe(2394_75);
  });

  test('taux global des droits de mutation ancien', () => {
    // 4,50 + 1,20 + 4,50 × 2,37 % = 5,80665
    expect(oldTransferTaxRatePct()).toBeCloseTo(5.80665, 5);
    expect(oldTransferTaxRatePct(true)).toBeCloseTo(6.3185, 4);
  });

  test('ancien 250 000 € : total ≈ 7,5 % du prix', () => {
    const r = estimateNotaryFees({ priceCents: 250_000_00, condition: 'old' });
    expect(r.transferTaxCents).toBe(14_516_63);
    expect(r.feesExclVatCents).toBe(2394_75);
    expect(r.feesVatCents).toBe(478_95);
    expect(r.securityContributionCents).toBe(250_00);
    expect(r.disbursementsCents).toBe(1_200_00);
    expect(r.totalCents).toBe(14_516_63 + 2394_75 + 478_95 + 250_00 + 1_200_00);
    expect(r.totalPct).toBeGreaterThan(7);
    expect(r.totalPct).toBeLessThan(8);
  });

  test('neuf : droits réduits, total ≈ 2 à 3 %', () => {
    const r = estimateNotaryFees({ priceCents: 250_000_00, condition: 'new' });
    expect(r.transferTaxCents).toBe(1787_50); // 0,715 %
    expect(r.totalPct).toBeGreaterThan(2);
    expect(r.totalPct).toBeLessThan(3);
  });

  test('le mobilier est déduit de l’assiette des droits mais pas des émoluments', () => {
    const base = estimateNotaryFees({ priceCents: 250_000_00, condition: 'old' });
    const withFurniture = estimateNotaryFees({
      priceCents: 250_000_00,
      condition: 'old',
      furnitureCents: 10_000_00,
    });
    expect(withFurniture.transferTaxCents).toBeLessThan(base.transferTaxCents);
    expect(withFurniture.feesExclVatCents).toBe(base.feesExclVatCents);
  });

  test('prix nul', () => {
    const r = estimateNotaryFees({ priceCents: 0, condition: 'old', disbursementsCents: 0 });
    expect(r.totalCents).toBe(0);
    expect(r.totalPct).toBe(0);
  });
});
