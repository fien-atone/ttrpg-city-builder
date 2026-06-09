import type { BuildingDef } from './types';

/**
 * Ordered by population threshold. Ids are stable keys; their human names live
 * in the i18n locales (buildings.<id>). `tag` drives the magic/tech gating.
 * `replacedBy` forms upgrade chains (palisade → wooden walls → stone walls),
 * `countPer` makes common buildings multiply with population.
 */
export const BUILDINGS: BuildingDef[] = [
  { id: 'camp_shelter', threshold: 0, tag: 'plain', replacedBy: 'houses' },
  { id: 'well', threshold: 10, tag: 'plain', countPer: 350 },
  { id: 'granary', threshold: 30, tag: 'plain', countPer: 1500 },
  { id: 'palisade', threshold: 35, tag: 'plain', replacedBy: 'wood_walls' },
  { id: 'smithy', threshold: 40, tag: 'plain', countPer: 700 },
  { id: 'shrine', threshold: 50, tag: 'plain' },
  { id: 'mill', threshold: 60, tag: 'tech', countPer: 900 },
  { id: 'mage_house', threshold: 90, tag: 'magic', needMagic: 2 },
  { id: 'houses', threshold: 120, tag: 'plain' },
  { id: 'market', threshold: 160, tag: 'plain' },
  { id: 'bathhouse', threshold: 220, tag: 'plain', countPer: 2500 },
  { id: 'stone_church', threshold: 250, tag: 'plain' },
  { id: 'bridge', threshold: 300, tag: 'plain' },
  { id: 'manor', threshold: 350, tag: 'plain' },
  { id: 'inn', threshold: 500, tag: 'plain', countPer: 1800 },
  { id: 'wood_walls', threshold: 600, tag: 'plain', replacedBy: 'stone_walls' },
  { id: 'guild_hall', threshold: 900, tag: 'plain' },
  { id: 'manufactory', threshold: 1200, tag: 'tech', needTech: true },
  { id: 'water_altar', threshold: 1200, tag: 'magic', needMagic: 3 },
  { id: 'stone_walls', threshold: 2000, tag: 'plain' },
  { id: 'town_hall', threshold: 2500, tag: 'plain' },
  { id: 'hospital', threshold: 3000, tag: 'magic', needMagic: 2 },
  { id: 'aqueduct', threshold: 4000, tag: 'tech' },
  { id: 'cathedral', threshold: 5000, tag: 'plain' },
  { id: 'university', threshold: 7000, tag: 'plain' },
];
