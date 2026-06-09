import type { Arcana, Contribute } from '../types';

export const arcanaDefaults: Arcana = {
  magic: 2,
  balance: 50,
};

export const arcanaPresets: Record<string, Partial<Arcana>> = {
  low_magic_industrial: { magic: 1, balance: 15 },
  balanced: { magic: 2, balance: 50 },
  high_magic_archaic: { magic: 4, balance: 85 },
  wild_magic: { magic: 5, balance: 70 },
};

export const arcanaContribute: Contribute = (lev, world) => {
  const a = world.arcana;
  // healing/harvest magic lowers mortality and lifts the ceiling
  lev.magicHeal += a.magic * 0.0035;
  lev.foodCapacity *= 1 + a.magic * 0.05;
  lev.sanitation *= 1 + a.magic * 0.04;
  // building gating flags consumed in buildings.ts
  lev.flags.add(`magic:${a.magic}`);
  if (a.balance > 60) lev.flags.add('magic_dominant');
  if (a.balance > 75) lev.flags.add('tech_suppressed');
};
