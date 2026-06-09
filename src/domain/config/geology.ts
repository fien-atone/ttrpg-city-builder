import type { Contribute, Geology, Resource, ResourceType } from '../types';

/** Typical market value of a deposit type (can be overridden per resource). */
export const RESOURCE_VALUE: Record<ResourceType, number> = {
  gold: 5,
  gems: 5,
  silver: 4,
  salt: 3,
  iron: 2,
  copper: 2,
  coal: 2,
  stone: 1,
  timber: 1,
};

export const geologyDefaults: Geology = {
  fertility: 3,
  resources: [{ type: 'stone', volume: 3, accessibility: 4, depth: 1, value: 1 }],
  stability: 4,
};

const R = (
  type: Resource['type'],
  volume: number,
  accessibility: number,
  depth: number,
  value = RESOURCE_VALUE[type],
): Resource => ({ type, volume, accessibility, depth, value });

export const geologyPresets: Record<string, Partial<Geology>> = {
  fertile_plain: { fertility: 5, resources: [R('stone', 2, 4, 1)], stability: 5 },
  iron_hills: { fertility: 3, resources: [R('iron', 4, 3, 2), R('coal', 3, 3, 2)], stability: 4 },
  gold_strike: { fertility: 2, resources: [R('gold', 4, 2, 4), R('silver', 3, 2, 3)], stability: 3 },
  salt_flats: { fertility: 1, resources: [R('salt', 5, 4, 1)], stability: 4 },
  barren_rock: { fertility: 1, resources: [R('stone', 4, 4, 1)], stability: 2 },
  rich_seam: { fertility: 3, resources: [R('gems', 3, 1, 5), R('iron', 3, 3, 2)], stability: 3 },
};

export const geologyContribute: Contribute = (lev, world, snap) => {
  const geo = world.geology;
  lev.foodCapacity *= 0.4 + geo.fertility * 0.22; // fertility 1→0.62, 5→1.5
  lev.sectorWeights.farming += 3 + geo.fertility * 2;

  // mining is driven by what is ACTUALLY worked (per-deposit lifecycle lives
  // in the simulation), not by what merely sits in the ground
  const draw = snap.miningDraw;
  if (draw > 0) {
    const knowHow = snap.capabilities.mining;
    lev.sectorWeights.mining += draw * 2.4;
    lev.sectorWeights.crafts += draw * 0.35 * knowHow;
    lev.migrationPull += draw * 0.18 * (0.1 + 0.9 * knowHow);
    if (draw >= 5 && knowHow > 0.3) lev.flags.add('rich_deposit');
  }
  if (geo.stability <= 2) lev.flags.add('unstable_ground');
};

/** Total reserve units a deposit holds (scaled by the local capacity baseline). */
export function depositReserve(r: Resource, baseK: number): number {
  return baseK * r.volume * 10;
}

/** Extraction intensity a worked deposit contributes: volume × how lucrative. */
export function depositDraw(r: Resource): number {
  return r.volume * (0.4 + r.value * 0.25);
}

/**
 * Is the deposit worth working, given the difficulty and the know-how at
 * hand? Rare & precious justifies hard digging; cheap & deep gets ignored;
 * easy & easy-to-find is nearly always worked once recognised.
 */
export function isWorkable(r: Resource, miningCap: number): boolean {
  const feasible = miningCap >= r.depth * 0.12; // skill/equipment to reach it
  const worthwhile = r.value * 1.2 + r.accessibility * 0.4 - r.depth * 0.6 >= 2;
  return feasible && worthwhile;
}

/** Obvious surface outcrops are known from day one; hidden veins are not. */
export function obviousAtFounding(r: Resource, miningCap: number): boolean {
  if (r.accessibility >= 4 && r.depth <= 2) return true; // anyone trips over it
  return miningCap >= 0.5 && r.accessibility >= 2; // prospectors recognise ore
}
