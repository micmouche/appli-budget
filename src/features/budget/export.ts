/** Exports CSV et PDF du module Budget. */
import i18n from '@/i18n';
import { csvCents, toCsv } from '@/utils/csv';
import { formatCents, formatDate, formatMonthKey } from '@/utils/format';
import { escapeHtml, pdfStyles, sharePdf, shareText } from '@/utils/share';
import { getSettings } from '@/store/settings';

import type { CategoryTotal } from './hooks';
import type { Category, Expense, Person } from '@/db/schema';
import { categoryLabel } from '@/db/repositories';

function markExported(): void {
  getSettings().set('lastExportAt', new Date().toISOString());
}

export async function exportMonthCsv(
  monthKey: string,
  expenses: Expense[],
  categories: Category[],
  persons: Person[],
): Promise<void> {
  const t = i18n.t.bind(i18n);
  const catById = new Map(categories.map((c) => [c.id, categoryLabel(c)]));
  const personById = new Map(persons.map((p) => [p.id, p.name]));
  const rows = expenses.map((e) => [
    e.date,
    catById.get(e.categoryId) ?? '',
    csvCents(e.amountCents),
    personById.get(e.paidById ?? '') ?? '',
    e.shared ? t('common.yes') : t('common.no'),
    e.note ?? '',
  ]);
  const csv = toCsv(
    [
      t('export.csvHeaderDate'),
      t('export.csvHeaderCategory'),
      t('export.csvHeaderAmount'),
      t('export.csvHeaderPaidBy'),
      t('export.csvHeaderShared'),
      t('export.csvHeaderNote'),
    ],
    rows,
  );
  await shareText(`pecule-budget-${monthKey}.csv`, csv, 'text/csv', t('export.shareTitle'));
  markExported();
}

export interface MonthSummaryForPdf {
  monthKey: string;
  totalCents: number;
  incomeCents: number;
  categoryTotals: CategoryTotal[];
  expenses: Expense[];
  categories: Category[];
  persons: Person[];
  settlementText: string | null;
}

export async function exportMonthPdf(summary: MonthSummaryForPdf): Promise<void> {
  const t = i18n.t.bind(i18n);
  const catById = new Map(summary.categories.map((c) => [c.id, categoryLabel(c)]));
  const personById = new Map(summary.persons.map((p) => [p.id, p.name]));
  const categoryRows = summary.categoryTotals
    .filter((c) => c.totalCents > 0)
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.label)}</td><td class="num">${c.count}</td><td class="num">${formatCents(c.totalCents)}</td><td class="num">${
          c.envelope ? formatCents(c.envelope.budgetCents) : '—'
        }</td></tr>`,
    )
    .join('');
  const expenseRows = [...summary.expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (e) =>
        `<tr><td>${formatDate(e.date)}</td><td>${escapeHtml(catById.get(e.categoryId) ?? '')}</td><td>${escapeHtml(e.note ?? '')}</td><td>${escapeHtml(
          personById.get(e.paidById ?? '') ?? '',
        )}</td><td class="num">${formatCents(e.amountCents)}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">${pdfStyles()}</head><body>
    <h1>${t('export.pdfTitle')} · ${escapeHtml(formatMonthKey(summary.monthKey))}</h1>
    <div class="muted">${escapeHtml(t('export.pdfGenerated', { date: formatDate(new Date()) }))}</div>
    <div class="kpis">
      <div class="kpi"><div class="label">${t('home.income')}</div><div class="value">${formatCents(summary.incomeCents)}</div></div>
      <div class="kpi"><div class="label">${t('home.expenses')}</div><div class="value">${formatCents(summary.totalCents)}</div></div>
      <div class="kpi"><div class="label">${t('budget.balance')}</div><div class="value">${formatCents(summary.incomeCents - summary.totalCents)}</div></div>
    </div>
    ${summary.settlementText ? `<p><strong>${t('budget.settlement')} :</strong> ${escapeHtml(summary.settlementText)}</p>` : ''}
    <h2>${t('budget.byCategory')}</h2>
    <table><thead><tr><th>${t('budget.category')}</th><th class="num">#</th><th class="num">${t('budget.spent')}</th><th class="num">${t('budget.budgetAmount')}</th></tr></thead>
    <tbody>${categoryRows}<tr class="total"><td>Total</td><td class="num">${summary.expenses.length}</td><td class="num">${formatCents(summary.totalCents)}</td><td></td></tr></tbody></table>
    <h2>${t('budget.expensesList')}</h2>
    <table><thead><tr><th>${t('budget.date')}</th><th>${t('budget.category')}</th><th>${t('budget.note')}</th><th>${t('budget.paidBy')}</th><th class="num">${t('budget.amount')}</th></tr></thead>
    <tbody>${expenseRows}</tbody></table>
    <div class="footer">Pécule · ${escapeHtml(t('common.disclaimer'))}</div>
  </body></html>`;
  await sharePdf(`pecule-budget-${summary.monthKey}.pdf`, html, t('export.shareTitle'));
  markExported();
}
