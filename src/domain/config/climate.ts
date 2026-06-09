import type { Climate, Contribute } from '../types';

export const climateDefaults: Climate = {
  temperature: 3,
  rainfall: 3,
  growingSeason: 3,
  hazards: { winters: false, storms: false, droughts: false },
};

export const climatePresets: Record<string, Partial<Climate>> = {
  temperate: { temperature: 3, rainfall: 3, growingSeason: 4, hazards: { winters: false, storms: false, droughts: false } },
  mediterranean: { temperature: 4, rainfall: 2, growingSeason: 5, hazards: { winters: false, storms: false, droughts: true } },
  arid: { temperature: 4, rainfall: 1, growingSeason: 2, hazards: { winters: false, storms: false, droughts: true } },
  subarctic: { temperature: 1, rainfall: 2, growingSeason: 1, hazards: { winters: true, storms: true, droughts: false } },
  monsoon: { temperature: 4, rainfall: 5, growingSeason: 4, hazards: { winters: false, storms: true, droughts: false } },
  highland: { temperature: 2, rainfall: 3, growingSeason: 2, hazards: { winters: true, storms: false, droughts: false } },
};

/**
 * "Harshness" is our *perception* of the climate, so it is derived from the
 * raw factors instead of being a dial: temperature extremes, a short warm
 * season and extra weather hazards all add up. Range ≈ 0..5.
 */
export function derivedHarshness(c: Climate): number {
  const extremeTemp = Math.abs(c.temperature - 3) * 0.8;
  const shortSeason = (5 - c.growingSeason) * 0.35;
  const hazardCount =
    (c.hazards.winters ? 1 : 0) + (c.hazards.storms ? 0.8 : 0) + (c.hazards.droughts ? 0.8 : 0);
  return extremeTemp + shortSeason + hazardCount;
}

export const climateContribute: Contribute = (lev, world) => {
  const c = world.climate;
  // rainfall feeds water; warm season & moderate temp feed food
  lev.waterCapacity *= 0.6 + c.rainfall * 0.12;
  const tempPenalty = Math.abs(c.temperature - 3) * 0.08; // extremes hurt
  lev.foodCapacity *= (0.55 + c.growingSeason * 0.16) * (1 - tempPenalty);
  if (c.hazards.droughts) lev.foodCapacity *= 0.88;

  // a harsh climate raises mortality and pushes people out
  const harsh = derivedHarshness(c);
  lev.mortality += Math.max(0, harsh - 1.2) * 0.004;
  lev.migrationPush += Math.max(0, harsh - 2.5) * 0.5;
  if (c.hazards.winters) lev.mortality += 0.002;
  if (harsh >= 3.2) lev.flags.add('harsh_climate');
  if (c.hazards.droughts || c.rainfall <= 1) lev.flags.add('drought_prone');
};
