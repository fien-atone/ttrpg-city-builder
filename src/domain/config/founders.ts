import type { Contribute, Founders, SpeciesId } from '../types';

export const foundersDefaults: Founders = {
  count: 80,
  species: 'human',
  health: 3,
  dependentsPct: 30,
  medianAge: 28,
  skill: 3,
};

export const foundersPresets: Record<string, Partial<Founders>> = {
  pioneer_families: { count: 80, species: 'human', health: 3, dependentsPct: 35, medianAge: 26, skill: 3 },
  veteran_garrison: { count: 60, species: 'human', health: 4, dependentsPct: 5, medianAge: 30, skill: 4 },
  refugee_column: { count: 140, species: 'human', health: 2, dependentsPct: 45, medianAge: 24, skill: 2 },
  dwarf_holdfast: { count: 50, species: 'dwarf', health: 4, dependentsPct: 20, medianAge: 60, skill: 5 },
  elf_enclave: { count: 30, species: 'elf', health: 4, dependentsPct: 15, medianAge: 90, skill: 5 },
  orc_warband: { count: 70, species: 'orc', health: 4, dependentsPct: 20, medianAge: 22, skill: 2 },
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

export const foundersContribute: Contribute = (lev, world) => {
  const f = world.founders;
  const healthFactor = 0.7 + f.health * 0.12;
  lev.naturalGrowth *= fertilityFactor(f.species) * healthFactor;
  lev.mortality += (3 - f.health) * 0.003;

  // a working-age, skilled founding stock starts crafts/services higher
  lev.sectorWeights.crafts += f.skill * 2;
  lev.sectorWeights.services += f.skill * 1.2;
  lev.sectorWeights.farming += 4; // everyone farms at first

  // many dependents early = slower productive growth
  if (f.dependentsPct >= 40) lev.flags.add('many_dependents');
};

/** Critical population floor below which the gene/skill pool can't sustain. */
export function viabilityFloor(f: Founders): number {
  const base = SPECIES_LIFESPAN[f.species] > 150 ? 12 : 25; // long-lived need fewer
  return Math.round(base * (1 + (3 - f.health) * 0.15));
}
