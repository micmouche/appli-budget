/** Hooks de lecture du module Épargne. */
import { useMemo } from 'react';

import { useQuery } from '@/db/useQuery';
import {
  goalAccountIds,
  listSavingsAccounts,
  listSavingsGoals,
  listSavingsMovements,
} from '@/db/repositories';
import type { SavingsAccount, SavingsGoal, SavingsMovement } from '@/db/schema';

import {
  averageMonthlyNet,
  balanceOf,
  ceilingStatus,
  depositsOf,
  monthlySeries,
  projectGoal,
  type CeilingStatus,
  type GoalProjection,
} from './logic';

export interface AccountSummary {
  account: SavingsAccount;
  balanceCents: number;
  depositsCents: number;
  ceiling: CeilingStatus | null;
}

export interface GoalSummary {
  goal: SavingsGoal;
  projection: GoalProjection;
  accountIds: string[];
}

export function useSavings() {
  const accounts = useQuery(() => listSavingsAccounts(), []);
  const movements = useQuery(() => listSavingsMovements(), []);
  const goals = useQuery(() => listSavingsGoals(), []);
  return useMemo(() => {
    const summaries: AccountSummary[] = accounts.map((account) => {
      const depositsCents = depositsOf(movements, account.id);
      return {
        account,
        balanceCents: balanceOf(movements, account.id),
        depositsCents,
        ceiling: ceilingStatus(account.ceilingCents, depositsCents),
      };
    });
    const totalCents = summaries.reduce((a, s) => a + s.balanceCents, 0);
    const series = monthlySeries(movements, 12);
    const goalSummaries: GoalSummary[] = goals.map((goal) => {
      const ids = goalAccountIds(goal);
      const linked = ids.length ? summaries.filter((s) => ids.includes(s.account.id)) : summaries;
      const currentCents = linked.reduce((a, s) => a + s.balanceCents, 0);
      const weightedRate = linked.length
        ? linked.reduce((a, s) => a + (s.account.rateX100 ?? 0) * Math.max(1, s.balanceCents), 0) /
          linked.reduce((a, s) => a + Math.max(1, s.balanceCents), 0) /
          100
        : 0;
      const projection = projectGoal({
        currentCents,
        targetCents: goal.targetCents,
        targetDate: goal.targetDate,
        averageMonthlyNetCents: averageMonthlyNet(movements, ids.length ? ids : null),
        annualRatePct: weightedRate,
      });
      return { goal, projection, accountIds: ids };
    });
    return { accounts: summaries, movements, goals: goalSummaries, totalCents, series };
  }, [accounts, movements, goals]);
}

export type { SavingsMovement };
