// Domain contracts. No React, no i18n, no display strings — only stable ids.
// Architecture: config domains --contribute()--> Levers --> per-year evolution --> Outcome.

// ───────────────────────── shared id unions ─────────────────────────
export type BuildingTag = 'plain' | 'magic' | 'tech';
export type PhaseId = 'camp' | 'hamlet' | 'village' | 'town' | 'city';
export type EventKind = 'plague' | 'famine' | 'raid' | 'fire' | 'exhausted' | 'collapse';

export type Sector =
  | 'farming'
  | 'mining'
  | 'crafts'
  | 'trade'
  | 'services'
  | 'military'
  | 'clergy'
  | 'knowledge'; // placeholder for the future education domain

export type Status =
  | 'founding'
  | 'struggling'
  | 'stable'
  | 'thriving'
  | 'declining'
  | 'abandoned';

export type Designation =
  | 'frontier_outpost'
  | 'agrarian'
  | 'mining_camp'
  | 'craft_town'
  | 'market_town'
  | 'border_fort'
  | 'religious_center'
  | 'city';

// ───────────────────────── config domains ─────────────────────────
export type BiomeId = 'plains' | 'forest' | 'desert' | 'hills' | 'mountains' | 'wetland' | 'tundra';
export type WaterFeature = 'none' | 'river' | 'lake' | 'coast' | 'rivermouth';
export type RoadAccess = 'isolated' | 'track' | 'minor_road' | 'highway' | 'crossroads';

export interface Geography {
  biome: BiomeId;
  water: WaterFeature;
  road: RoadAccess;
  ruggedness: number; // 1..5 — terrain difficulty, suppresses sprawl & movement
}

export type ResourceType = 'iron' | 'copper' | 'gold' | 'silver' | 'gems' | 'coal' | 'stone' | 'salt' | 'timber';
export interface Resource {
  type: ResourceType;
  volume: number; // 1..5 total reserve
  accessibility: number; // 1..5 (low = hidden / deep / hard to extract)
  depth: number; // 1..5 (deep = needs more labour / tech)
}
export interface Geology {
  fertility: number; // 1..5 soil
  resources: Resource[];
  stability: number; // 1..5 — quakes/sinkholes when low
}

export interface Climate {
  temperature: number; // 1 (frigid) .. 5 (hot)
  rainfall: number; // 1 (arid) .. 5 (wet)
  harshness: number; // 1..5 — storms, winters, mortality pressure
  growingSeason: number; // 1..5 — length of the productive season
}

export type SpeciesId = 'human' | 'elf' | 'dwarf' | 'halfling' | 'orc';
export interface Founders {
  count: number;
  species: SpeciesId;
  health: number; // 1..5
  dependentsPct: number; // 0..60 — children/elderly share at founding
  medianAge: number; // years
  skill: number; // 1..5 — share of useful trades/professions
}

export interface Wildlife {
  game: number; // 1..5 — huntable animals (food)
  predators: number; // 0..5 — wolves/big cats etc.
  monsters: number; // 0..5 — magical threats
  aggression: number; // 0..5 — how often the wilds strike the settlement
}

export type NeighborType = 'hamlet' | 'town' | 'city' | 'capital' | 'fort' | 'port';
export type Relation = 'allied' | 'friendly' | 'neutral' | 'rival' | 'hostile';
export interface Neighbor {
  id: string;
  type: NeighborType;
  distance: number; // travel-days
  linkSpeed: number; // 1..5 — quality/speed of the connection
  relation: Relation;
}

export type Sovereignty = 'independent' | 'vassal' | 'colony' | 'protectorate';
export interface Polity {
  sovereignty: Sovereignty;
  borderProximity: number; // 1 (deep interior) .. 5 (right on the frontier)
  stability: number; // 1..5 — central authority's strength
  taxBurden: number; // 0..5 — levies that push people out / drain capital
}

export type MissionId =
  | 'new_nation'
  | 'frontier_town'
  | 'resource_extraction'
  | 'military_outpost'
  | 'stop_nomads'
  | 'religious_haven'
  | 'trade_hub';
export interface Mission {
  goal: MissionId;
  targetPopulation: number; // success threshold
  horizonYears: number; // by when it should be met
}

export type SupportKind = 'investment' | 'subsidy' | 'aid';
export interface SupportKeyframe {
  year: number;
  amount: number; // 0..5 funding intensity at this year
  kind: SupportKind;
}
export interface SupportCfg {
  keyframes: SupportKeyframe[]; // time-varying funding trajectory (interpolated)
}

// lightweight magic/tech setting (keeps the "magic + tech" premise & building gating)
export interface Arcana {
  magic: number; // 0..5 — regional magic level
  balance: number; // 0..100 — 0 tech .. 100 magic
}

export type ScheduledKind =
  | 'road_built'
  | 'war_begins'
  | 'war_ends'
  | 'sovereignty_change'
  | 'climate_shift'
  | 'resource_strike';
export interface ScheduledChange {
  id: string;
  year: number;
  kind: ScheduledKind;
  magnitude: number; // 1..5 — strength of the change
}

export interface WorldConfig {
  version: number;
  horizonYears: number;
  seed: number;
  shocksEnabled: boolean;
  geography: Geography;
  geology: Geology;
  climate: Climate;
  founders: Founders;
  wildlife: Wildlife;
  neighbors: Neighbor[];
  polity: Polity;
  mission: Mission;
  support: SupportCfg;
  arcana: Arcana;
  scheduledChanges: ScheduledChange[];
}

// keys of the domain sub-configs that have preset pickers
export type DomainKey =
  | 'geography'
  | 'geology'
  | 'climate'
  | 'founders'
  | 'wildlife'
  | 'polity'
  | 'mission'
  | 'arcana';

// ───────────────────────── levers (stable model interface) ─────────────────────────
export interface Levers {
  foodCapacity: number; // food "units" → people
  waterCapacity: number; // 0.5..1.5 multiplier
  importCapacity: number; // 1..~5 multiplier on K via trade/links
  safety: number; // ~0.4..1.4
  sanitation: number; // ~0.4..1.4
  naturalGrowth: number; // base annual rate
  mortality: number; // extra annual mortality
  migrationPull: number; // inflow strength
  migrationPush: number; // outflow strength
  transientFlow: number; // 0..~0.4 — share of pop as passers-through
  funding: number; // this-year funding amount
  raidPressure: number; // 0..n hazard intensity
  defense: number; // counters raidPressure
  magicHeal: number; // mortality relief from magic
  sectorWeights: Record<Sector, number>;
  flags: Set<string>;
}

/** Read-only snapshot of the evolving settlement passed to contributors. */
export interface StateSnapshot {
  year: number;
  population: number;
  reserves: number; // remaining resource reserve (Infinity if none)
}

/** A domain's contribution: mutate the lever accumulator from its config slice. */
export type Contribute = (lev: Levers, world: WorldConfig, snap: StateSnapshot) => void;

// ───────────────────────── runtime / output ─────────────────────────
export interface BuildingDef {
  id: string;
  threshold: number; // min population
  tag: BuildingTag;
  needMagic?: number; // requires regional magic >= n
  needTech?: boolean; // suppressed in strongly magical regions
}

export interface BuildingState {
  id: string;
  tag: BuildingTag;
  threshold: number;
  unlocked: boolean;
}

export interface Composition {
  locals: number;
  migrants: number;
  transients: number; // non-resident, shown alongside
  dependents: number; // subset of residents who don't work
}

export interface SimEvent {
  year: number;
  kind: EventKind;
  severity: number; // 0..1 fraction lost (0 for non-population events)
}

export interface YearState {
  year: number;
  population: number;
  capacity: number;
  phase: PhaseId;
  growth: number;
  status: Status;
  designation: Designation;
  funding: number;
  buildings: BuildingState[];
  composition: Composition;
  sectors: Record<Sector, number>; // normalized shares summing to 1
}

export interface MissionResult {
  met: boolean;
  partial: boolean;
  achievedYear: number | null;
  peakVsTarget: number; // peak population / target
}

export interface Outcome {
  finalStatus: Status;
  collapsed: { year: number; reason: EventKind | 'starvation' | 'depopulation' | 'unfunded' } | null;
  mission: MissionResult;
}

export interface DesignationChange {
  year: number;
  designation: Designation;
}

export interface SimResult {
  points: YearState[];
  events: SimEvent[];
  years: number;
  peak: number;
  outcome: Outcome;
  designationHistory: DesignationChange[];
}
