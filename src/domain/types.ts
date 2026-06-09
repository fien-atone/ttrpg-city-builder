// Domain contracts. No React, no i18n, no display strings — only stable ids.

export type ArchetypeId = 'homestead' | 'village' | 'fort' | 'mine' | 'mission';
export type BuildingTag = 'plain' | 'magic' | 'tech';
export type PhaseId = 'camp' | 'hamlet' | 'village' | 'town' | 'city';
export type EventKind = 'plague' | 'famine' | 'raid' | 'fire' | 'exhausted';

/** Everything the user can dial. Plain serialisable data. */
export interface SimParams {
  archetype: ArchetypeId;
  pop0: number;
  years: number;
  // carrying-capacity factors (1..5)
  fertility: number;
  water: number;
  trade: number;
  safety: number;
  sanitation: number;
  // pace factors (0..5)
  attractiveness: number;
  capital: number;
  // magic / technology
  magic: number; // 0..5
  balance: number; // 0..100, 0 = pure tech, 100 = pure magic
  // events
  shocksEnabled: boolean;
  resourceCap: boolean;
  seed: number;
}

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

export interface SimEvent {
  year: number;
  kind: EventKind;
  severity: number; // 0..1 fraction of population lost
}

export interface YearPoint {
  year: number;
  population: number;
  capacity: number; // K at this year
  phase: PhaseId;
  growth: number; // fraction vs previous year
  buildings: BuildingState[];
}

export interface SimResult {
  points: YearPoint[];
  events: SimEvent[];
  years: number;
  peak: number;
}
