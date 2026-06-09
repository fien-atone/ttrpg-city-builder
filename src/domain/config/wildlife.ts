import type { Contribute, Wildlife } from '../types';

export const wildlifeDefaults: Wildlife = {
  game: 3,
  predators: 1,
  monsters: 0,
  aggression: 1,
};

export const wildlifePresets: Record<string, Partial<Wildlife>> = {
  tame_lowlands: { game: 3, predators: 1, monsters: 0, aggression: 0 },
  rich_hunting: { game: 5, predators: 2, monsters: 0, aggression: 1 },
  wolf_country: { game: 3, predators: 4, monsters: 0, aggression: 3 },
  monster_haunted: { game: 2, predators: 2, monsters: 4, aggression: 4 },
  deadlands: { game: 1, predators: 3, monsters: 5, aggression: 5 },
};

export const wildlifeContribute: Contribute = (lev, world) => {
  const w = world.wildlife;
  // game adds food; predators/monsters add hazard and lower safety
  lev.foodCapacity *= 1 + w.game * 0.04;
  const threat = w.predators * 0.5 + w.monsters * 1.0;
  lev.raidPressure += threat * (0.5 + w.aggression * 0.3);
  lev.safety *= 1 - Math.min(0.5, threat * 0.05);
  if (w.monsters >= 3) {
    lev.flags.add('monster_threat');
    lev.sectorWeights.military += w.monsters * 1.5;
  }
};
