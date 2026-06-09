import type { Contribute, Geography } from '../types';

export const geographyDefaults: Geography = {
  biome: 'plains',
  water: 'river',
  road: 'track',
  ruggedness: 2,
};

export const geographyPresets: Record<string, Partial<Geography>> = {
  coastal_trade: { biome: 'plains', water: 'coast', road: 'minor_road', ruggedness: 1 },
  river_valley: { biome: 'plains', water: 'river', road: 'minor_road', ruggedness: 2 },
  deep_forest: { biome: 'forest', water: 'river', road: 'isolated', ruggedness: 3 },
  desert_oasis: { biome: 'desert', water: 'lake', road: 'track', ruggedness: 2 },
  mountain_pass: { biome: 'mountains', water: 'none', road: 'highway', ruggedness: 5 },
  isolated_steppe: { biome: 'plains', water: 'none', road: 'isolated', ruggedness: 1 },
  river_mouth_port: { biome: 'wetland', water: 'rivermouth', road: 'crossroads', ruggedness: 1 },
};

const WATER_IMPORT: Record<Geography['water'], number> = {
  none: 1,
  river: 1.6,
  lake: 1.2,
  coast: 2.4,
  rivermouth: 3.0,
};
const ROAD_IMPORT: Record<Geography['road'], number> = {
  isolated: 1,
  track: 1.2,
  minor_road: 1.7,
  highway: 2.3,
  crossroads: 2.8,
};
const ROAD_TRANSIENT: Record<Geography['road'], number> = {
  isolated: 0.0,
  track: 0.03,
  minor_road: 0.08,
  highway: 0.16,
  crossroads: 0.24,
};
const BIOME_FOOD: Record<Geography['biome'], number> = {
  plains: 1.0,
  forest: 0.8,
  desert: 0.4,
  hills: 0.8,
  mountains: 0.5,
  wetland: 0.7,
  tundra: 0.4,
};

export const geographyContribute: Contribute = (lev, world) => {
  const g = world.geography;
  // links lift the ceiling (import food) and bring traffic
  lev.importCapacity *= WATER_IMPORT[g.water] * ROAD_IMPORT[g.road];
  lev.transientFlow += ROAD_TRANSIENT[g.road];
  lev.foodCapacity *= BIOME_FOOD[g.biome];
  lev.waterCapacity *= g.water === 'none' ? 0.7 : 1.05;

  // a route on a good road pulls migrants and trade
  const routePull = (ROAD_IMPORT[g.road] - 1) + (WATER_IMPORT[g.water] - 1) * 0.5;
  lev.migrationPull += routePull * 0.6;
  lev.sectorWeights.trade += routePull * 6;
  lev.sectorWeights.services += routePull * 2;

  // forests yield timber crafts; rugged terrain suppresses sprawl & movement
  if (g.biome === 'forest') lev.sectorWeights.crafts += 4;
  if (g.biome === 'wetland' || g.water === 'coast' || g.water === 'rivermouth') {
    lev.sectorWeights.trade += 3;
  }
  lev.importCapacity *= 1 - (g.ruggedness - 1) * 0.06;
  if (g.ruggedness >= 4) lev.flags.add('rugged');
};
