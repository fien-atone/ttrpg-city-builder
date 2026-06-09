import type { BuildingDef } from './types';

/**
 * Ordered by population threshold. Ids are stable keys; their human names live
 * in the i18n locales (buildings.<id>). `tag` drives the magic/tech gating,
 * `needCap` requires settlement know-how (a stone church needs real clergy, a
 * manufactory needs master craftsmen), `replacedBy` forms upgrade chains and
 * `countPer` makes common buildings multiply with population.
 */
export const BUILDINGS: BuildingDef[] = [
  { id: 'camp_shelter', threshold: 0, tag: 'plain', replacedBy: 'houses' },
  { id: 'well', threshold: 10, tag: 'plain', countPer: 350 },
  { id: 'granary', threshold: 30, tag: 'plain', countPer: 1500 },
  { id: 'palisade', threshold: 35, tag: 'plain', replacedBy: 'wood_walls' },
  { id: 'smithy', threshold: 40, tag: 'plain', countPer: 700, needCap: { sector: 'crafts', level: 0.25 } },
  { id: 'shrine', threshold: 50, tag: 'plain', needCap: { sector: 'clergy', level: 0.12 } },
  { id: 'mill', threshold: 60, tag: 'tech', countPer: 900, needCap: { sector: 'crafts', level: 0.3 } },
  { id: 'mage_house', threshold: 90, tag: 'magic', needMagic: 2 },
  { id: 'houses', threshold: 120, tag: 'plain' },
  { id: 'market', threshold: 160, tag: 'plain', needCap: { sector: 'trade', level: 0.2 } },
  { id: 'bathhouse', threshold: 220, tag: 'plain', countPer: 2500 },
  { id: 'stone_church', threshold: 250, tag: 'plain', needCap: { sector: 'clergy', level: 0.35 } },
  { id: 'bridge', threshold: 300, tag: 'plain' },
  { id: 'manor', threshold: 350, tag: 'plain' },
  { id: 'inn', threshold: 500, tag: 'plain', countPer: 1800 },
  { id: 'wood_walls', threshold: 600, tag: 'plain', replacedBy: 'stone_walls' },
  { id: 'guild_hall', threshold: 900, tag: 'plain', needCap: { sector: 'trade', level: 0.4 } },
  { id: 'manufactory', threshold: 1200, tag: 'tech', needTech: true, needCap: { sector: 'crafts', level: 0.6 } },
  { id: 'water_altar', threshold: 1200, tag: 'magic', needMagic: 3 },
  { id: 'stone_walls', threshold: 2000, tag: 'plain' },
  { id: 'town_hall', threshold: 2500, tag: 'plain' },
  { id: 'hospital', threshold: 3000, tag: 'magic', needMagic: 2, needCap: { sector: 'knowledge', level: 0.3 } },
  { id: 'aqueduct', threshold: 4000, tag: 'tech', needCap: { sector: 'crafts', level: 0.5 } },
  { id: 'cathedral', threshold: 5000, tag: 'plain', needCap: { sector: 'clergy', level: 0.6 } },
  { id: 'university', threshold: 7000, tag: 'plain', needCap: { sector: 'knowledge', level: 0.55 } },
];
