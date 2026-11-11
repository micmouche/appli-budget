/** Hooks de lecture du module Travaux. */
import { useMemo } from 'react';

import { listLots, listProjects, listQuotes, listWorkPayments } from '@/db/repositories';
import type { WorkPayment, WorkProject } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { toIso } from '@/features/rental/logic';

import {
  buildLotViews,
  projectTotals,
  workPaymentStatus,
  type LotView,
  type ProjectTotals,
  type WorkPaymentStatus,
} from './logic';

export interface PaymentView {
  payment: WorkPayment;
  status: WorkPaymentStatus;
}

export interface ProjectView {
  project: WorkProject;
  lots: LotView[];
  payments: PaymentView[];
  totals: ProjectTotals;
}

export function useWorks(): ProjectView[] {
  const projects = useQuery(() => listProjects(), []);
  const lots = useQuery(() => listLots(), []);
  const quotes = useQuery(() => listQuotes(), []);
  const payments = useQuery(() => listWorkPayments(), []);
  return useMemo(() => {
    const today = toIso(new Date());
    return projects.map((project) => {
      const ownPayments = payments.filter((p) => p.projectId === project.id);
      const lotViews = buildLotViews(
        lots.filter((l) => l.projectId === project.id),
        quotes.filter((q) => q.projectId === project.id),
        ownPayments,
        today,
      );
      return {
        project,
        lots: lotViews,
        payments: ownPayments.map((payment) => ({ payment, status: workPaymentStatus(payment, today) })),
        totals: projectTotals(project.budgetCents, lotViews, ownPayments),
      };
    });
  }, [projects, lots, quotes, payments]);
}
