import type { Contribute, FounderBackground, Founders, MissionId, Sector, SpeciesId } from '../types';

export const foundersDefaults: Founders = {
  count: 80,
  species: 'human',
  background: 'farmers',
  health: 3,
  dependentsPct: 30,
  medianAge: 28,
  skill: 3,
};

export const foundersPresets: Record<string, Partial<Founders>> = {
  pioneer_families: { count: 80, species: 'human', background: 'farmers', health: 3, dependentsPct: 35, medianAge: 26, skill: 3 },
  veteran_garrison: { count: 60, species: 'human', background: 'soldiers', health: 4, dependentsPct: 5, medianAge: 30, skill: 4 },
  refugee_column: { count: 140, species: 'human', background: 'mixed', health: 2, dependentsPct: 45, medianAge: 24, skill: 2 },
  dwarf_holdfast: { count: 50, species: 'dwarf', background: 'miners', health: 4, dependentsPct: 20, medianAge: 60, skill: 5 },
  elf_enclave: { count: 30, species: 'elf', background: 'scholars', health: 4, dependentsPct: 15, medianAge: 90, skill: 5 },
  orc_warband: { count: 70, species: 'orc', background: 'soldiers', health: 4, dependentsPct: 20, medianAge: 22, skill: 2 },
};

/** Average lifespan per species — drives natural growth and the viability floor. */
export const SPECIES_LIFESPAN: Record<SpeciesId, number> = {
  human: 70,
  elf: 600,
  dwarf: 250,
  halfling: 100,
  orc: 55,
};

/** Long-lived species reproduce slowly (fewer generations per century). */
function fertilityFactor(species: SpeciesId): number {
  const l = SPECIES_LIFESPAN[species];
  return Math.min(1.4, 80 / l + 0.2); // human ~1.34, elf ~0.33, dwarf ~0.52
}

/**
 * What everyone can do regardless of background: subsist-farm, keep an inn,
 * raise a militia. Specialist crafts are nearly zero without the right people.
 */
const CAP_FLOOR: Record<Sector, number> = {
  farming: 0.55,
  services: 0.25,
  military: 0.2,
  crafts: 0.15,
  trade: 0.08,
  mining: 0.04,
  clergy: 0.08,
  knowledge: 0.02,
};

/** What each founding stock brings with them. */
const BACKGROUND_CAPS: Record<FounderBackground, Partial<Record<Sector, number>>> = {
  farmers: { farming: 0.9, crafts: 0.3 },
  soldiers: { military: 0.9, crafts: 0.25, farming: 0.35 },
  miners: { mining: 0.9, crafts: 0.45, farming: 0.3 },
  merchants: { trade: 0.9, services: 0.55, knowledge: 0.2 },
  clergy: { clergy: 0.9, knowledge: 0.35, farming: 0.3 },
  scholars: { knowledge: 0.9, clergy: 0.3, crafts: 0.3 },
  mixed: { farming: 0.5, crafts: 0.35, trade: 0.25, services: 0.35, military: 0.3 },
};

/** A mission ships the right people: an extraction charter brings miners. */
const MISSION_CAP_SEED: Partial<Record<MissionId, { sector: Sector; level: number }>> = {
  resource_extraction: { sector: 'mining', level: 0.75 },
  trade_hub: { sector: 'trade', level: 0.7 },
  military_outpost: { sector: 'military', level: 0.85 },
  stop_nomads: { sector: 'military', level: 0.85 },
  religious_haven: { sector: 'clergy', level: 0.8 },
};

/** Starting know-how of the settlement: floors ∨ background × skill, plus the mission's seed. */
export function initialCapabilities(f: Founders, goal: MissionId): Record<Sector, number> {
  const skillMult = 0.6 + f.skill * 0.12; // 0.72 .. 1.2
  const caps = {} as Record<Sector, number>;
  for (const s of Object.keys(CAP_FLOOR) as Sector[]) {
    const bg = (BACKGROUND_CAPS[f.background][s] ?? 0) * skillMult;
    caps[s] = Math.min(0.95, Math.max(CAP_FLOOR[s], bg));
  }
  const seed = MISSION_CAP_SEED[goal];
  if (seed) caps[seed.sector] = Math.max(caps[seed.sector], seed.level);
  return caps;
}

export const foundersContribute: Contribute = (lev, world) => {
  const f = world.founders;
  const healthFactor = 0.7 + f.health * 0.12;
  lev.naturalGrowth *= fertilityFactor(f.species) * healthFactor;
  lev.mortality += (3 - f.health) * 0.003;

  // base opportunity weights; actual shares are gated by capabilities in the loop
  lev.sectorWeights.farming += 4;
  lev.sectorWeights.crafts += f.skill * 1.5;
  lev.sectorWeights.services += f.skill * 1;

  if (f.dependentsPct >= 40) lev.flags.add('many_dependents');
};

/** Critical population floor below which the gene/skill pool can't sustain. */
export function viabilityFloor(f: Founders): number {
  const base = SPECIES_LIFESPAN[f.species] > 150 ? 12 : 25; // long-lived need fewer
  return Math.round(base * (1 + (3 - f.health) * 0.15));
}
