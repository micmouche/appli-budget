/** Exports du module Locatif : quittance / reçu PDF, déclaration annuelle CSV. */
import i18n from '@/i18n';
import type { Lease, RentPayment, RentalProperty } from '@/db/schema';
import { getSettings } from '@/store/settings';
import { csvCents, toCsv } from '@/utils/csv';
import { formatCents, formatDate, formatMonthKey } from '@/utils/format';
import { escapeHtml, pdfStyles, sharePdf, shareText } from '@/utils/share';

import { totalDue, type DeclarationSummary } from './logic';

function periodBounds(periodKey: string): { from: string; to: string } {
  const [y, m] = periodKey.split('-').map(Number);
  const first = new Date(y ?? 2000, (m ?? 1) - 1, 1);
  const last = new Date(y ?? 2000, m ?? 1, 0);
  return { from: formatDate(first, 'd MMMM yyyy'), to: formatDate(last, 'd MMMM yyyy') };
}

export async function exportReceiptPdf(
  payment: RentPayment,
  lease: Lease,
  property: RentalProperty,
): Promise<void> {
  const t = i18n.t.bind(i18n);
  const s = getSettings();
  const due = totalDue(payment);
  const partial = payment.paidCents < due;
  const landlord = s.landlordName || '—';
  const { from, to } = periodBounds(payment.periodKey);
  const body = partial
    ? t('rental.partialReceiptText', {
        landlord,
        tenant: lease.tenantName,
        amount: formatCents(payment.paidCents),
        total: formatCents(due),
        remaining: formatCents(due - payment.paidCents),
      })
    : t('rental.receiptText', { landlord, tenant: lease.tenantName, amount: formatCents(payment.paidCents) });
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">${pdfStyles()}
    <style>.parties{display:flex;justify-content:space-between;gap:24px;margin:18px 0}.party{flex:1}.party .who{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5E6470}.box{border:1px solid #E3E1DA;border-radius:8px;padding:14px 16px;margin:14px 0}.sig{margin-top:40px;text-align:right}</style></head><body>
    <h1>${partial ? t('rental.partialReceiptTitle') : t('rental.receiptTitle')}</h1>
    <div class="muted">${escapeHtml(formatMonthKey(payment.periodKey))} · ${escapeHtml(t('rental.receiptPeriod', { from, to }))}</div>
    <div class="parties">
      <div class="party"><div class="who">${t('rental.landlord')}</div><div><strong>${escapeHtml(landlord)}</strong></div><div class="muted">${escapeHtml(s.landlordAddress)}</div></div>
      <div class="party"><div class="who">Locataire</div><div><strong>${escapeHtml(lease.tenantName)}</strong></div><div class="muted">${escapeHtml(property.address || property.name)}</div></div>
    </div>
    <div class="box">
      <table><tbody>
        <tr><td>${t('rental.rent')}</td><td class="num">${formatCents(payment.rentCents)}</td></tr>
        <tr><td>${t('rental.charges')}</td><td class="num">${formatCents(payment.chargesCents)}</td></tr>
        <tr class="total"><td>Total</td><td class="num">${formatCents(due)}</td></tr>
        <tr><td>${t('rental.amountPaid')}${payment.paidAt ? ` (${formatDate(payment.paidAt)})` : ''}</td><td class="num">${formatCents(payment.paidCents)}</td></tr>
      </tbody></table>
    </div>
    <p>${escapeHtml(body)}</p>
    ${partial ? '' : `<p class="muted">${escapeHtml(t('rental.receiptFooter'))}</p>`}
    <p>${escapeHtml(t('rental.madeAt', { city: s.landlordCity || '—', date: formatDate(new Date(), 'd MMMM yyyy') }))}</p>
    <div class="sig">${t('rental.signature')}<br/><br/><strong>${escapeHtml(landlord)}</strong></div>
    <div class="footer">Pécule</div>
  </body></html>`;
  await sharePdf(
    `quittance-${payment.periodKey}-${lease.tenantName.replace(/\s+/g, '-')}.pdf`,
    html,
    t('export.shareTitle'),
  );
  s.set('lastExportAt', new Date().toISOString());
}

export async function exportDeclarationCsv(
  summary: DeclarationSummary,
  propertyNames: string[],
): Promise<void> {
  const t = i18n.t.bind(i18n);
  const rows: (string | number)[][] = [[t('rental.rentsCollected'), csvCents(summary.rentsCollectedCents)]];
  for (const [nature, cents] of Object.entries(summary.byNature))
    rows.push([t(`rental.natures.${nature}`), csvCents(cents)]);
  rows.push([t('rental.deductibleTotal'), csvCents(summary.deductibleTotalCents)]);
  rows.push([t('rental.netResult'), csvCents(summary.netResultCents)]);
  const csv = toCsv(
    [`${t('rental.declaration')} ${summary.year} — ${propertyNames.join(', ')}`, t('budget.amount')],
    rows,
  );
  await shareText(`pecule-declaration-${summary.year}.csv`, csv, 'text/csv', t('export.shareTitle'));
  getSettings().set('lastExportAt', new Date().toISOString());
}
