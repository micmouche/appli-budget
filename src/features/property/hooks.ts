/** Hooks du module Immobilier. */
import { useMemo } from 'react';

import { listScenarios } from '@/db/repositories';
import type { PropertyScenario } from '@/db/schema';
import { useQuery } from '@/db/useQuery';

import { computeScenario, type ScenarioResult } from './logic';

export interface ScenarioSummary {
  scenario: PropertyScenario;
  result: ScenarioResult;
}

export function useScenarios(): ScenarioSummary[] {
  const rows = useQuery(() => listScenarios(), []);
  return useMemo(() => rows.map((scenario) => ({ scenario, result: computeScenario(scenario) })), [rows]);
}
