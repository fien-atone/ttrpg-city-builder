import type { Climate, Contribute } from '../types';

export const climateDefaults: Climate = {
  temperature: 3,
  rainfall: 3,
  harshness: 2,
  growingSeason: 3,
};

export const climatePresets: Record<string, Partial<Climate>> = {
  temperate: { temperature: 3, rainfall: 3, harshness: 2, growingSeason: 4 },
  mediterranean: { temperature: 4, rainfall: 2, harshness: 1, growingSeason: 5 },
  arid: { temperature: 4, rainfall: 1, harshness: 3, growingSeason: 2 },
  subarctic: { temperature: 1, rainfall: 2, harshness: 5, growingSeason: 1 },
  monsoon: { temperature: 4, rainfall: 5, harshness: 3, growingSeason: 4 },
  highland: { temperature: 2, rainfall: 3, harshness: 4, growingSeason: 2 },
};

export const climateContribute: Contribute = (lev, world) => {
  const c = world.climate;
  // rainfall feeds water; growing season & moderate temp feed food
  lev.waterCapacity *= 0.6 + c.rainfall * 0.12;
  const tempPenalty = Math.abs(c.temperature - 3) * 0.08; // extremes hurt
  lev.foodCapacity *= (0.55 + c.growingSeason * 0.16) * (1 - tempPenalty);

  // harsh climate raises mortality and pushes people out
  lev.mortality += (c.harshness - 2) * 0.004;
  lev.migrationPush += Math.max(0, c.harshness - 3) * 0.4;
  if (c.harshness >= 4) lev.flags.add('harsh_climate');
  if (c.rainfall <= 1) lev.flags.add('drought_prone');
};
