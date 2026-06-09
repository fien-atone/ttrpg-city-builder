import { useMemo } from 'react';
import type { WorldConfig, SimResult } from '../domain/types';
import { simulate } from '../domain/simulate';

/** Memoised selector: re-runs the pure model only when the world config changes. */
export function useSimulation(config: WorldConfig): SimResult {
  return useMemo(() => simulate(config), [config]);
}
