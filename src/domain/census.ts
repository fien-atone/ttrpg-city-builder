import type { WorldConfig, YearState } from './types';
import { buildLevers } from './levers';
import { applySchedule } from './trajectory';

/**
 * The GM-facing layer: turns shares and multipliers into table-ready facts —
 * how many smiths, how many hectares of fields, where the food actually
 * comes from. Numbers are deliberately "gameable" approximations, not
 * agronomy: ~1.2 ha of cropland feeds a person, a family farmstead works
 * ~6 ha, ~3 ha of pasture feeds a person on livestock.
 */

export type FoodChannelId = 'crops' | 'livestock' | 'hunting' | 'fishing' | 'imports' | 'magic';

export interface FoodBalance {
  need: number; // rations: 1 ration feeds 1 person for a year
  supplied: number;
  deficit: number;
  channels: { id: FoodChannelId; rations: number; share: number }[];
}

export interface LandUse {
  cropsHa: number;
  pastureHa: number;
  farmsteads: number;
}

export type ProfessionId =
  | 'farmers'
  | 'herders'
  | 'hunters'
  | 'fishers'
  | 'miners'
  | 'smiths'
  | 'craftsmen'
  | 'merchants'
  | 'innkeepers'
  | 'guards'
  | 'priests'
  | 'scholars'
  | 'mages';

export interface Census {
  workforce: number;
  food: FoodBalance;
  land: LandUse;
  professions: { id: ProfessionId; count: number }[];
}

const PASTURE_BIOME: Record<WorldConfig['geography']['biome'], number> = {
  plains: 1.2,
  hills: 1.0,
  forest: 0.5,
  desert: 0.4,
  mountains: 0.6,
  wetland: 0.6,
  tundra: 0.8,
};

const HUNT_BIOME: Record<WorldConfig['geography']['biome'], number> = {
  plains: 0.8,
  hills: 1.0,
  forest: 1.5,
  desert: 0.4,
  mountains: 1.0,
  wetland: 1.1,
  tundra: 1.3,
};

const FISH_WATER: Record<WorldConfig['geography']['water'], number> = {
  none: 0,
  river: 0.6,
  lake: 0.7,
  coast: 1.1,
  rivermouth: 1.3,
};

export function deriveCensus(point: YearState, world: WorldConfig): Census {
  const worldY = applySchedule(world, point.year);
  const pop = point.population;
  const lev = buildLevers(worldY, {
    year: point.year,
    population: pop,
    reserves: Infinity,
    development: point.development,
    prosperity: point.prosperity,
    capabilities: point.capabilities,
  });

  const dependents = point.composition.dependents;
  const workforce = Math.max(0, pop - dependents);
  const s = point.sectors;

  // ---- food balance: distribute what the land+links actually supply ----
  const g = worldY.geography;
  const weights: Record<FoodChannelId, number> = {
    crops: worldY.geology.fertility * worldY.climate.growingSeason * s.farming * 1.0,
    livestock: PASTURE_BIOME[g.biome] * s.farming * 2.2,
    hunting: worldY.wildlife.game * HUNT_BIOME[g.biome] * 0.35,
    fishing: FISH_WATER[g.water] * 1.6,
    imports: Math.max(0, lev.importCapacity - 1) * (s.trade * 4 + 0.25),
    magic: worldY.arcana.magic * 0.5,
  };
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const supplied = Math.min(pop, point.capacity);
  const deficit = Math.max(0, pop - point.capacity);
  const channels = (Object.keys(weights) as FoodChannelId[])
    .map((id) => ({
      id,
      rations: (supplied * weights[id]) / totalW,
      share: weights[id] / totalW,
    }))
    .filter((c) => c.rations >= 0.5)
    .sort((a, b) => b.rations - a.rations);

  // ---- land use from the food the settlement grows itself ----
  const cropRations = channels.find((c) => c.id === 'crops')?.rations ?? 0;
  const livestockRations = channels.find((c) => c.id === 'livestock')?.rations ?? 0;
  const cropsHa = cropRations * 1.2;
  const pastureHa = livestockRations * 3;
  const farmsteads = Math.round(cropsHa / 6);

  // ---- professions: sector workers + notable full-timers from buildings ----
  const bcount = (id: string) => point.buildings.find((b) => b.id === id)?.count ?? 0;
  const farmWorkers = workforce * s.farming;
  const huntShare = (weights.hunting + weights.fishing) / totalW;

  const rawProfessions: { id: ProfessionId; count: number }[] = [
    { id: 'farmers', count: farmWorkers * (weights.crops / Math.max(0.01, weights.crops + weights.livestock)) },
    { id: 'herders', count: farmWorkers * (weights.livestock / Math.max(0.01, weights.crops + weights.livestock)) },
    { id: 'hunters', count: workforce * huntShare * 0.5 * (weights.hunting / Math.max(0.01, weights.hunting + weights.fishing)) },
    { id: 'fishers', count: workforce * huntShare * 0.5 * (weights.fishing / Math.max(0.01, weights.hunting + weights.fishing)) },
    { id: 'miners', count: workforce * s.mining },
    { id: 'smiths', count: bcount('smithy') > 0 ? bcount('smithy') + Math.floor((workforce * s.crafts) / 60) : 0 },
    { id: 'craftsmen', count: workforce * s.crafts },
    { id: 'merchants', count: Math.max(bcount('market') > 0 ? 2 : 0, (workforce * s.trade) / 4) },
    { id: 'innkeepers', count: bcount('inn') * 3 },
    { id: 'guards', count: workforce * s.military },
    { id: 'priests', count: Math.max(bcount('shrine') + bcount('stone_church') * 3 + bcount('cathedral') * 8, (workforce * s.clergy) / 3) },
    { id: 'scholars', count: (workforce * s.knowledge) / 2 },
    {
      id: 'mages',
      count:
        worldY.arcana.magic >= 2 && bcount('mage_house') > 0
          ? Math.max(1, Math.round(pop * 0.0008 * worldY.arcana.magic))
          : 0,
    },
  ];
  const professions = rawProfessions
    .map((p) => ({ ...p, count: Math.round(p.count) }))
    .filter((p) => p.count >= 1);

  return {
    workforce,
    food: { need: pop, supplied, deficit, channels },
    land: { cropsHa, pastureHa, farmsteads },
    professions,
  };
}
