import type { Designation, Sector, WorldConfig } from './types';

/**
 * Emergent purpose from the dominant economic sector, strategic position and size.
 * `prev` adds hysteresis so the label doesn't flap year to year.
 */
export function deriveDesignation(
  sectors: Record<Sector, number>,
  world: WorldConfig,
  population: number,
  prev: Designation | null,
): Designation {
  if (population >= 5000) return 'city';
  if (population < 120 && world.polity.borderProximity >= 3) return 'frontier_outpost';

  // dominant sector + runner-up (for hysteresis margin)
  const ranked = (Object.keys(sectors) as Sector[])
    .map((s) => [s, sectors[s]] as const)
    .sort((a, b) => b[1] - a[1]);
  const top = ranked[0][0];
  const topV = ranked[0][1];
  const secondV = ranked[1]?.[1] ?? 0;

  let candidate: Designation;
  switch (top) {
    case 'mining':
      candidate = 'mining_camp';
      break;
    case 'military':
      candidate = 'border_fort';
      break;
    case 'clergy':
      candidate = 'religious_center';
      break;
    case 'trade':
      candidate = 'market_town';
      break;
    case 'crafts':
      candidate = 'craft_town';
      break;
    default:
      candidate = 'agrarian';
  }

  // hysteresis: keep prev unless the new leader is clearly ahead
  if (prev && prev !== candidate && topV - secondV < 0.06) return prev;
  return candidate;
}
