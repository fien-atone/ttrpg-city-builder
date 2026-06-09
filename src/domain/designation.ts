import type { Designation, Sector, WorldConfig } from './types';

/**
 * Minimum population for a designation to be credible: forty people cannot be
 * a "market town" no matter what they trade. A settlement that shrinks below
 * its designation's floor is demoted (ghost-town realism).
 */
const SIZE_GATES: Record<Designation, number> = {
  frontier_outpost: 0,
  agrarian: 60,
  mining_camp: 80,
  border_fort: 100,
  religious_center: 150,
  craft_town: 400,
  market_town: 500,
  city: 5000,
};

function sectorCandidate(top: Sector, world: WorldConfig): Designation {
  switch (top) {
    case 'mining':
      return 'mining_camp';
    case 'military':
      return 'border_fort';
    case 'clergy':
      return 'religious_center';
    case 'trade':
      return 'market_town';
    case 'crafts':
      return 'craft_town';
    default:
      return world.polity.borderProximity >= 4 ? 'frontier_outpost' : 'agrarian';
  }
}

/** Walk down the "respectability ladder" until the size gate is satisfied. */
function demote(d: Designation, pop: number, world: WorldConfig): Designation {
  const ladder: Designation[] = [
    d,
    'agrarian',
    'mining_camp',
    'frontier_outpost',
  ];
  for (const step of ladder) {
    if (pop >= SIZE_GATES[step]) return step;
  }
  return 'frontier_outpost';
}

/**
 * Emergent purpose from the dominant economic sector, gated by absolute size.
 * `prev` adds hysteresis so the label doesn't flap year to year — but only
 * while `prev` itself is still size-eligible.
 */
export function deriveDesignation(
  sectors: Record<Sector, number>,
  world: WorldConfig,
  population: number,
  prev: Designation | null,
): Designation {
  // a held designation keeps a 15% size band so the label doesn't flap
  // while the population oscillates around a gate
  const holdsBand = (d: Designation) => population >= SIZE_GATES[d] * 0.85;

  if (population >= SIZE_GATES.city || (prev === 'city' && holdsBand('city'))) return 'city';
  if (population < SIZE_GATES.agrarian) {
    if (prev && prev !== 'frontier_outpost' && holdsBand(prev)) return prev;
    return 'frontier_outpost';
  }

  const ranked = (Object.keys(sectors) as Sector[])
    .map((s) => [s, sectors[s]] as const)
    .sort((a, b) => b[1] - a[1]);
  const topV = ranked[0][1];
  const secondV = ranked[1]?.[1] ?? 0;

  let candidate = sectorCandidate(ranked[0][0], world);
  if (population < SIZE_GATES[candidate]) {
    // shrank below the candidate's gate: hold the old label within its band,
    // otherwise honestly demote
    if (prev && holdsBand(prev)) return prev;
    candidate = demote(candidate, population, world);
  }

  // sector hysteresis: keep prev unless the new leader is clearly ahead — but
  // a prev that lost its size band (the town shrank) is dropped immediately
  if (prev && prev !== candidate && holdsBand(prev) && topV - secondV < 0.06) {
    return prev;
  }
  return candidate;
}
