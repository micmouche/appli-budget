/** Export PDF de synthèse d'un chantier. */
import i18n from '@/i18n';
import { getSettings } from '@/store/settings';
import { formatCents, formatDate, formatPct } from '@/utils/format';
import { escapeHtml, pdfStyles, sharePdf } from '@/utils/share';

import type { ProjectView } from './hooks';
import { quoteInclVat } from './logic';

export async function exportProjectPdf(view: ProjectView): Promise<void> {
  const t = i18n.t.bind(i18n);
  const lotRows = view.lots
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.lot.name)}</td><td class="num">${formatCents(l.lot.budgetCents)}</td><td class="num">${formatCents(l.acceptedCents)}</td><td class="num">${formatCents(l.paidCents)}</td><td class="num">${formatCents(l.status.varianceCents)}</td></tr>`,
    )
    .join('');
  const quoteRows = view.lots
    .flatMap((l) =>
      l.quotes.map(
        (q) =>
          `<tr><td>${escapeHtml(l.lot.name)}</td><td>${escapeHtml(q.contractor)}</td><td class="num">${formatCents(q.amountExclVatCents)}</td><td class="num">${q.vatRateX10 / 10} %</td><td class="num">${formatCents(quoteInclVat(q))}</td><td>${t(`works.statuses.${q.status}`)}</td></tr>`,
      ),
    )
    .join('');
  const paymentRows = view.payments
    .map(
      (p) =>
        `<tr><td>${formatDate(p.payment.dueDate)}</td><td>${escapeHtml(p.payment.label)}</td><td>${t(`works.paymentKinds.${p.payment.kind}`)}</td><td class="num">${formatCents(p.payment.amountCents)}</td><td>${p.payment.paidAt ? formatDate(p.payment.paidAt) : '—'}</td></tr>`,
    )
    .join('');
  const tot = view.totals;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">${pdfStyles()}</head><body>
    <h1>${escapeHtml(view.project.name)}</h1>
    <div class="muted">${escapeHtml(t('export.pdfGenerated', { date: formatDate(new Date()) }))}</div>
    <div class="kpis">
      <div class="kpi"><div class="label">${t('works.budget')}</div><div class="value">${formatCents(tot.budgetCents)}</div></div>
      <div class="kpi"><div class="label">${t('works.committed')}</div><div class="value">${formatCents(tot.committedCents)}</div></div>
      <div class="kpi"><div class="label">${t('works.paid')}</div><div class="value">${formatCents(tot.paidCents)}</div></div>
      <div class="kpi"><div class="label">${t('works.variance')}</div><div class="value">${formatCents(tot.varianceCents)} (${formatPct(tot.variancePct)})</div></div>
    </div>
    <h2>${t('works.byLot')}</h2>
    <table><thead><tr><th>${t('works.lots')}</th><th class="num">${t('works.budget')}</th><th class="num">${t('works.committed')}</th><th class="num">${t('works.paid')}</th><th class="num">${t('works.variance')}</th></tr></thead><tbody>${lotRows}</tbody></table>
    <h2>${t('works.quotes')}</h2>
    <table><thead><tr><th>${t('works.lots')}</th><th>${t('works.contractor')}</th><th class="num">HT</th><th class="num">${t('works.vatRate')}</th><th class="num">TTC</th><th>${t('works.quoteStatus')}</th></tr></thead><tbody>${quoteRows}</tbody></table>
    <h2>${t('works.payments')}</h2>
    <table><thead><tr><th>${t('works.dueDate')}</th><th>${t('works.paymentLabel')}</th><th>Type</th><th class="num">${t('budget.amount')}</th><th>${t('works.paidDate')}</th></tr></thead><tbody>${paymentRows}</tbody></table>
    <div class="footer">Pécule</div>
  </body></html>`;
  await sharePdf(
    `pecule-chantier-${view.project.name.replace(/\s+/g, '-')}.pdf`,
    html,
    t('export.shareTitle'),
  );
  getSettings().set('lastExportAt', new Date().toISOString());
}
