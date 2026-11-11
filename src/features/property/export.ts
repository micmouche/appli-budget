/** Exports du module Immobilier : tableau d'amortissement en CSV et PDF. */
import i18n from '@/i18n';
import type { LoanInput, LoanResult } from '@/finance/loan';
import { getSettings } from '@/store/settings';
import { csvCents, toCsv } from '@/utils/csv';
import { formatCents, formatDate } from '@/utils/format';
import { escapeHtml, pdfStyles, sharePdf, shareText } from '@/utils/share';

import { yearlyAmortization } from './logic';

export async function exportAmortizationCsv(loan: LoanResult, input: LoanInput): Promise<void> {
  const t = i18n.t.bind(i18n);
  const csv = toCsv(
    [
      t('property.month'),
      t('budget.amount'),
      t('property.interest'),
      t('property.capitalPart'),
      t('property.insurance'),
      t('property.remaining'),
    ],
    loan.schedule.map((r) => [
      r.month,
      csvCents(r.paymentCents),
      csvCents(r.interestCents),
      csvCents(r.principalCents),
      csvCents(r.insuranceCents),
      csvCents(r.remainingCents),
    ]),
  );
  await shareText(
    `pecule-amortissement-${input.principalCents / 100}-${input.months}m.csv`,
    csv,
    'text/csv',
    t('export.shareTitle'),
  );
  getSettings().set('lastExportAt', new Date().toISOString());
}

export async function exportAmortizationPdf(loan: LoanResult, input: LoanInput): Promise<void> {
  const t = i18n.t.bind(i18n);
  const years = yearlyAmortization(loan.schedule);
  const rows = years
    .map(
      (y) =>
        `<tr><td>${y.year}</td><td class="num">${formatCents(y.interestCents)}</td><td class="num">${formatCents(y.principalCents)}</td><td class="num">${formatCents(y.insuranceCents)}</td><td class="num">${formatCents(y.remainingCents)}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">${pdfStyles()}</head><body>
    <h1>${t('property.amortization')}</h1>
    <div class="muted">${escapeHtml(t('export.pdfGenerated', { date: formatDate(new Date()) }))}</div>
    <div class="kpis">
      <div class="kpi"><div class="label">${t('property.principal')}</div><div class="value">${formatCents(input.principalCents)}</div></div>
      <div class="kpi"><div class="label">${t('property.rate')}</div><div class="value">${input.annualRatePct} % · ${input.months} mois</div></div>
      <div class="kpi"><div class="label">${t('property.totalMonthly')}</div><div class="value">${formatCents(loan.totalMonthlyCents)}</div></div>
      <div class="kpi"><div class="label">${t('property.totalCost')}</div><div class="value">${formatCents(loan.totalCostCents)}</div></div>
    </div>
    <h2>${t('property.showYears')}</h2>
    <table><thead><tr><th>${t('savings.simYear')}</th><th class="num">${t('property.interest')}</th><th class="num">${t('property.capitalPart')}</th><th class="num">${t('property.insurance')}</th><th class="num">${t('property.remaining')}</th></tr></thead>
    <tbody>${rows}<tr class="total"><td>Total</td><td class="num">${formatCents(loan.totalInterestCents)}</td><td class="num">${formatCents(input.principalCents)}</td><td class="num">${formatCents(loan.totalInsuranceCents)}</td><td></td></tr></tbody></table>
    <div class="footer">Pécule · ${escapeHtml(t('common.disclaimer'))}</div>
  </body></html>`;
  await sharePdf(
    `pecule-amortissement-${input.principalCents / 100}-${input.months}m.pdf`,
    html,
    t('export.shareTitle'),
  );
  getSettings().set('lastExportAt', new Date().toISOString());
}
