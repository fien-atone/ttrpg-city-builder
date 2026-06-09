import type { ArchetypeId } from './types';

export interface ArchetypeCfg {
  /** default starting population */
  pop: number;
  /** migration attractiveness modifier */
  attr: number;
  /** sponsor-capital modifier */
  cap: number;
  /** natural-growth multiplier (fort reproduces poorly, etc.) */
  baseR: number;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeCfg> = {
  homestead: { pop: 15, attr: -1, cap: -2, baseR: 1.0 },
  village: { pop: 80, attr: 0, cap: 0, baseR: 1.0 },
  fort: { pop: 60, attr: -1, cap: +1, baseR: 0.4 },
  mine: { pop: 120, attr: +1, cap: 0, baseR: 0.9 },
  mission: { pop: 25, attr: +1, cap: -1, baseR: 0.8 },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];
