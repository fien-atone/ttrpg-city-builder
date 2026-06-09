import type { Contribute, DomainKey, WorldConfig } from '../types';
import { geographyDefaults, geographyPresets, geographyContribute } from './geography';
import { geologyDefaults, geologyPresets, geologyContribute } from './geology';
import { climateDefaults, climatePresets, climateContribute } from './climate';
import { foundersDefaults, foundersPresets, foundersContribute } from './founders';
import { wildlifeDefaults, wildlifePresets, wildlifeContribute } from './wildlife';
import { neighborsDefaults, neighborsContribute } from './neighbors';
import { polityDefaults, polityPresets, polityContribute } from './polity';
import { missionDefaults, missionPresets, missionContribute } from './mission';
import { supportDefaults, supportContribute } from './support';
import { arcanaDefaults, arcanaPresets, arcanaContribute } from './arcana';

export const CONFIG_VERSION = 1;

/** Contributors run in this order to build the lever bundle each year. */
export const CONTRIBUTORS: Contribute[] = [
  geographyContribute,
  geologyContribute,
  climateContribute,
  foundersContribute,
  wildlifeContribute,
  neighborsContribute,
  polityContribute,
  missionContribute,
  supportContribute,
  arcanaContribute,
];

export const defaultWorldConfig: WorldConfig = {
  version: CONFIG_VERSION,
  horizonYears: 120,
  seed: 42,
  shocksEnabled: true,
  geography: geographyDefaults,
  geology: geologyDefaults,
  climate: climateDefaults,
  founders: foundersDefaults,
  wildlife: wildlifeDefaults,
  neighbors: neighborsDefaults,
  polity: polityDefaults,
  mission: missionDefaults,
  support: supportDefaults,
  arcana: arcanaDefaults,
  scheduledChanges: [],
};

/** Preset banks for the domains that expose a preset picker in the UI. */
export const DOMAIN_PRESETS: Record<DomainKey, Record<string, Partial<unknown>>> = {
  geography: geographyPresets,
  geology: geologyPresets,
  climate: climatePresets,
  founders: foundersPresets,
  wildlife: wildlifePresets,
  polity: polityPresets,
  mission: missionPresets,
  arcana: arcanaPresets,
};
