import type { Levers, Sector, WorldConfig, StateSnapshot } from './types';
import { CONTRIBUTORS } from './config';

export const SECTORS: Sector[] = [
  'farming',
  'mining',
  'crafts',
  'trade',
  'services',
  'military',
  'clergy',
  'knowledge',
];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

function emptySectors(): Record<Sector, number> {
  return {
    farming: 0,
    mining: 0,
    crafts: 0,
    trade: 0,
    services: 0,
    military: 0,
    clergy: 0,
    knowledge: 0,
  };
}

/** Neutral starting point; contributors add/multiply onto this. */
function baseLevers(): Levers {
  return {
    foodCapacity: 1,
    waterCapacity: 1,
    importCapacity: 1,
    safety: 1,
    sanitation: 0.9,
    naturalGrowth: 0.01,
    mortality: 0,
    migrationPull: 0,
    migrationPush: 0,
    transientFlow: 0,
    funding: 0,
    raidPressure: 0,
    defense: 0.5,
    magicHeal: 0,
    sectorWeights: emptySectors(),
    flags: new Set<string>(),
  };
}

/** Run every domain contributor in registry order. */
export function buildLevers(world: WorldConfig, snap: StateSnapshot): Levers {
  const lev = baseLevers();
  for (const contribute of CONTRIBUTORS) contribute(lev, world, snap);
  return lev;
}

/** Carrying capacity from the lever bundle. */
export function capacityFrom(lev: Levers): number {
  const k =
    400 *
    Math.max(lev.foodCapacity, 0.1) *
    clamp(lev.waterCapacity, 0.3, 1.7) *
    clamp(lev.importCapacity, 0.5, 11) *
    clamp(lev.safety, 0.3, 1.5) *
    clamp(lev.sanitation, 0.3, 1.5);
  return clamp(k, 50, 200000);
}

/** Sector weights → shares summing to 1 (falls back to all-farming if empty). */
export function normalizeSectors(weights: Record<Sector, number>): Record<Sector, number> {
  const out = emptySectors();
  let total = 0;
  for (const s of SECTORS) total += Math.max(0, weights[s]);
  if (total <= 0) {
    out.farming = 1;
    return out;
  }
  for (const s of SECTORS) out[s] = Math.max(0, weights[s]) / total;
  return out;
}
