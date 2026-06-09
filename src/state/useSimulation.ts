import { useMemo } from 'react';
import type { SimParams, SimResult } from '../domain/types';
import { simulate } from '../domain/simulate';

/** Memoised selector: re-runs the pure model only when params change. */
export function useSimulation(params: SimParams): SimResult {
  return useMemo(() => simulate(params), [params]);
}
