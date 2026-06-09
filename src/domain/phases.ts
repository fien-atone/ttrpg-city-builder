import type { PhaseId } from './types';

/** Population → settlement phase. */
export function phaseOf(pop: number): PhaseId {
  if (pop < 30) return 'camp';
  if (pop < 150) return 'hamlet';
  if (pop < 600) return 'village';
  if (pop < 5000) return 'town';
  return 'city';
}
